// 워크넷(work24.go.kr) 채용정보 크롤러.
//
// 오픈API 키가 아직 승인되지 않아 웹사이트를 직접 크롤링한다
// (CLAUDE.md "지켜야 할 규칙", docs/roadmap_phase2.md 참고).
// 목록 페이지는 겉보기엔 JS로 데이터를 그리는 것처럼 보이지만, 실제로는
// 검색 조건을 쿼리파라미터로 붙여 GET하면 서버가 완성된 HTML을 그대로
// 내려준다(세션/쿠키 불필요, 직접 확인함). 그래서 상세 페이지를 별도로
// 요청하지 않고 목록 페이지 파싱만으로 필요한 필드를 거의 다 채운다.
//
// 페이지 구조가 바뀌면 이 파일의 파싱 로직만 고치면 되도록,
// 크롤링 파이프라인과 관련 없는 다른 코드는 이 파일을 몰라도 되게 만든다.

import * as cheerio from "cheerio";
import { randomUUID } from "node:crypto";
// scripts/collect-worknet.mjs가 이 파일을 상대경로로 직접 import해서 실행하므로
// (scripts/migrate.mjs와 같은 방식, tsconfig의 @/ 별칭은 plain node에서 해석 안 됨)
// 여기서는 @/ 별칭 대신 상대경로를 쓴다.
import { db } from "../db.ts";
import { getRegionCodes } from "../worknet.ts";

const BASE_URL = "https://www.work24.go.kr";
const LIST_PATH = "/wk/a/b/1200/retriveDtlEmpSrchList.do";

// 페이지당 건수 / 최대 페이지 수: 서버 부담과 배치 실행 시간을 줄이기 위해
// 베타 단계에서는 작게 잡는다. 필요해지면 나중에 조정.
const LIST_COUNT = 20;
const MAX_PAGES = 5;
const REQUEST_DELAY_MS = 800;

// 일반 브라우저와 동일한 User-Agent. work24는 봇 식별 UA를 요구하지 않고,
// robots.txt도 이 목록/상세 경로(/wk/a/b/...)를 막지 않는다 (사전 확인함).
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

interface ParsedListing {
  sourceId: string;
  infoTypeCd: string;
  infoTypeGroup: string;
  title: string;
  companyName: string | null;
  regionCode: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  careerMinYears: number | null;
  postedAt: string | null;
  closingAt: string | null;
  sourceUrl: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 채용제목 키워드로 TMP01~08(src/lib/worknet.ts의 자리표시자 직종코드)을 추정한다.
// 실제 워크넷 직종코드는 팝업 트리 UI로만 선택 가능해 URL에 노출되지 않아서
// 이 방식으로 대체한다 (베타 한정 근사치, 정확도는 낮음).
const JOB_CATEGORY_KEYWORDS: Array<{ code: string; keywords: string[] }> = [
  { code: "TMP02", keywords: ["개발", "프로그래", "IT", "소프트웨어", "웹", "앱", "SW", "네트워크", "데이터"] },
  { code: "TMP06", keywords: ["디자인", "디자이너", "편집", "영상"] },
  { code: "TMP07", keywords: ["연구원", "연구개발", "R&D"] },
  { code: "TMP08", keywords: ["교육", "강사", "학원", "교사"] },
  { code: "TMP03", keywords: ["영업", "마케팅", "세일즈", "광고", "홍보", "MD"] },
  { code: "TMP04", keywords: ["생산", "제조", "조립", "공장", "설비", "품질"] },
  { code: "TMP05", keywords: ["서비스", "요양", "간병", "매장", "판매", "고객", "미화", "조리", "주방"] },
  { code: "TMP01", keywords: ["사무", "경영", "총무", "인사", "회계", "구매", "비서"] },
];

export function classifyJobCategory(title: string): string | null {
  for (const { code, keywords } of JOB_CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => title.includes(keyword))) {
      return code;
    }
  }
  return null;
}

// 카드에 노출되는 지역 텍스트(예: "경기도 김포시 월곶면")의 첫 시/도 이름을
// 온보딩과 같은 REGION_CODES 목록과 대조해 코드로 바꾼다.
async function resolveRegionCode(siteText: string): Promise<string | null> {
  const regionCodes = await getRegionCodes();
  const matched = regionCodes.find((region) => siteText.includes(region.name));
  return matched?.code ?? null;
}

function extractSalary(dollarText: string): { min: number | null; max: number | null } {
  // "4,000만원"처럼 천단위 쉼표가 들어간 경우 콤마를 지우지 않으면 "4"와 "000"으로
  // 잘못 쪼개진다. 쉼표를 먼저 제거하고 숫자를 뽑는다.
  const numbers = dollarText.replace(/,/g, "").match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length === 0) return { min: null, max: null };
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return { min: numbers[0], max: numbers[1] };
}

function extractCareerMinYears(memberText: string): number | null {
  if (memberText.includes("경력무관") || memberText.includes("관계없음") || memberText.includes("신입")) {
    return 0;
  }
  const match = memberText.match(/(\d+)\s*년/);
  return match ? Number(match[1]) : null;
}

function extractDate(label: string, text: string): string | null {
  const match = text.match(new RegExp(`${label}\\s*:\\s*(\\d{4}-\\d{2}-\\d{2})`));
  return match ? match[1] : null;
}

async function fetchListPage(pageNo: number): Promise<string> {
  const url = new URL(LIST_PATH, BASE_URL);
  url.searchParams.set("occupation", "");
  url.searchParams.set("keyword", "");
  url.searchParams.set("region", "");
  url.searchParams.set("listCount", String(LIST_COUNT));
  url.searchParams.set("currentPageNo", String(pageNo));

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`워크넷 목록 페이지 요청 실패: HTTP ${response.status}`);
  }

  return response.text();
}

async function parseListPage(html: string): Promise<ParsedListing[]> {
  const $ = cheerio.load(html);
  const listings: ParsedListing[] = [];

  for (const row of $('tr[id^="list"]').toArray()) {
    const $row = $(row);
    const detailLink = $row.find("a[data-emp-detail]").first();
    const href = detailLink.attr("href");
    if (!href) continue;

    const detailUrl = new URL(href, BASE_URL);
    const sourceId = detailUrl.searchParams.get("wantedAuthNo");
    const infoTypeCd = detailUrl.searchParams.get("infoTypeCd");
    const infoTypeGroup = detailUrl.searchParams.get("infoTypeGroup");
    if (!sourceId || !infoTypeCd || !infoTypeGroup) continue;

    const title = detailLink.text().trim().replace(/\s+/g, " ");
    const companyName = $row.find("a.cp_name").first().text().trim() || null;

    const siteText = $row.find("li.site p").first().text().trim();
    const regionCode = siteText ? await resolveRegionCode(siteText) : null;

    const dollarText = $row.find("li.dollar").first().text();
    const { min: salaryMin, max: salaryMax } = extractSalary(dollarText);

    const memberText = $row.find("li.member").first().text();
    const careerMinYears = extractCareerMinYears(memberText);

    // 첫 번째 td도 class="al_left pd24"라 "td.pd24"로 찾으면 잘못 걸린다.
    // 날짜는 p.s1_r 안에만 있으므로 이걸로 특정한다.
    const dateText = $row.find("p.s1_r").text();
    const postedAt = extractDate("등록일", dateText);
    const closingAt = extractDate("마감일", dateText);

    listings.push({
      sourceId,
      infoTypeCd,
      infoTypeGroup,
      title,
      companyName,
      regionCode,
      salaryMin,
      salaryMax,
      careerMinYears,
      postedAt,
      closingAt,
      sourceUrl: detailUrl.toString(),
    });
  }

  return listings;
}

async function upsertListings(listings: ParsedListing[]): Promise<void> {
  if (listings.length === 0) return;

  const statements = listings.map((listing) => ({
    sql: `INSERT INTO job_postings (
            id, source, source_id, title, company_name, region_code,
            job_category_code, salary_min, salary_max, career_min_years,
            posted_at, closing_at, source_url, collected_at
          ) VALUES (?, 'worknet_crawl', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(source, source_id) DO UPDATE SET
            title = excluded.title,
            company_name = excluded.company_name,
            region_code = excluded.region_code,
            job_category_code = excluded.job_category_code,
            salary_min = excluded.salary_min,
            salary_max = excluded.salary_max,
            career_min_years = excluded.career_min_years,
            posted_at = excluded.posted_at,
            closing_at = excluded.closing_at,
            source_url = excluded.source_url,
            collected_at = datetime('now')`,
    args: [
      randomUUID(),
      listing.sourceId,
      listing.title,
      listing.companyName,
      listing.regionCode,
      classifyJobCategory(listing.title),
      listing.salaryMin,
      listing.salaryMax,
      listing.careerMinYears,
      listing.postedAt,
      listing.closingAt,
      listing.sourceUrl,
    ],
  }));

  await db.batch(statements, "write");
}

async function deleteExpiredPostings(): Promise<void> {
  await db.execute({
    sql: `DELETE FROM job_postings
          WHERE source = 'worknet_crawl' AND closing_at IS NOT NULL AND closing_at < date('now')`,
    args: [],
  });
}

export interface CollectResult {
  fetchedCount: number;
  insertedCount: number;
  failedCount: number;
  errorMessage: string | null;
}

export async function collectWorknetJobs(): Promise<CollectResult> {
  let fetchedCount = 0;
  let insertedCount = 0;
  let failedCount = 0;
  let errorMessage: string | null = null;

  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo++) {
    let html: string;
    try {
      html = await fetchListPage(pageNo);
    } catch (firstError) {
      // 실패 시 1회만 재시도하고, 그래도 실패하면 이후 페이지는 포기한다
      // (계속 실패하는 상태에서 요청을 반복하는 건 서버 부담만 키운다).
      await sleep(REQUEST_DELAY_MS);
      try {
        html = await fetchListPage(pageNo);
      } catch (secondError) {
        failedCount++;
        errorMessage = secondError instanceof Error ? secondError.message : String(secondError);
        console.error(`워크넷 크롤링 실패 (page ${pageNo}):`, firstError, secondError);
        break;
      }
    }

    const listings = await parseListPage(html);
    if (listings.length === 0) break; // 더 이상 결과 없음

    fetchedCount += listings.length;
    try {
      await upsertListings(listings);
      insertedCount += listings.length;
    } catch (upsertError) {
      failedCount += listings.length;
      errorMessage = upsertError instanceof Error ? upsertError.message : String(upsertError);
      console.error(`워크넷 upsert 실패 (page ${pageNo}):`, upsertError);
    }

    if (pageNo < MAX_PAGES) await sleep(REQUEST_DELAY_MS);
  }

  await deleteExpiredPostings();

  return { fetchedCount, insertedCount, failedCount, errorMessage };
}
