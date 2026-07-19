// 매칭 스코어링 — 순수 함수만 모아둔 파일 (DB 접근 없음).
// DB에서 데이터를 가져와 이 함수를 호출하는 코드는 src/lib/matching-queries.ts에 있다.
// 순수 함수로 분리해둔 이유: DB 연결 없이 단위테스트가 가능해야 해서
// (docs/roadmap_phase2.md 3절, matching.test.ts 참고).

export interface JobPostingForMatching {
  id: string;
  title: string;
  companyName: string | null;
  regionCode: string | null;
  jobCategoryCode: string | null;
  companySize: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  sourceUrl: string;
}

export interface UserPreferencesForMatching {
  regions: string[];
  jobCategories: string[];
  companySize: string[] | null;
  salaryMin: number | null;
}

export interface PriorityWeights {
  region: number;
  job: number;
  salary: number;
  company_size: number;
}

// priority_weights에 레코드가 없는 사용자는 균등 배분으로 간주한다
// (docs/db-schema.md 설계 메모).
export const DEFAULT_WEIGHTS: PriorityWeights = {
  region: 25,
  job: 25,
  salary: 25,
  company_size: 25,
};

export interface MatchBreakdown {
  region: number;
  job: number;
  salary: number;
  company_size: number;
}

export interface MatchResult {
  posting: JobPostingForMatching;
  total: number;
  breakdown: MatchBreakdown;
}

function scoreRegion(posting: JobPostingForMatching, prefs: UserPreferencesForMatching): number {
  if (!posting.regionCode) return 0;
  return prefs.regions.includes(posting.regionCode) ? 100 : 0;
}

function scoreJob(posting: JobPostingForMatching, prefs: UserPreferencesForMatching): number {
  if (!posting.jobCategoryCode) return 0;
  return prefs.jobCategories.includes(posting.jobCategoryCode) ? 100 : 0;
}

function scoreSalary(posting: JobPostingForMatching, prefs: UserPreferencesForMatching): number {
  // 사용자가 희망 최소연봉을 아직 안 정했으면 평가 불가 → 감점하지 않는다.
  if (prefs.salaryMin == null) return 100;
  // 공고에 급여 정보가 없으면 조건 충족 여부를 확인할 수 없다 → 0점(미달로 취급).
  if (posting.salaryMax == null) return 0;
  return posting.salaryMax >= prefs.salaryMin ? 100 : 0;
}

function scoreCompanySize(posting: JobPostingForMatching, prefs: UserPreferencesForMatching): number {
  // 사용자가 기업규모를 선택 안 했으면 조건 없음 → 100점.
  if (!prefs.companySize || prefs.companySize.length === 0) return 100;
  // 크롤러가 기업규모를 못 가져온 공고는 정보 없음으로 보고 감점하지 않는다
  // (roadmap_phase2.md 표에 없는 엣지케이스, 설계 결정으로 이렇게 보완함).
  if (!posting.companySize) return 100;
  return prefs.companySize.includes(posting.companySize) ? 100 : 0;
}

export function scoreJobPosting(
  posting: JobPostingForMatching,
  prefs: UserPreferencesForMatching,
  weights: PriorityWeights = DEFAULT_WEIGHTS
): MatchResult {
  const breakdown: MatchBreakdown = {
    region: scoreRegion(posting, prefs),
    job: scoreJob(posting, prefs),
    salary: scoreSalary(posting, prefs),
    company_size: scoreCompanySize(posting, prefs),
  };

  const total =
    (breakdown.region * weights.region +
      breakdown.job * weights.job +
      breakdown.salary * weights.salary +
      breakdown.company_size * weights.company_size) /
    100;

  return { posting, total, breakdown };
}
