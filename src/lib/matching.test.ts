import { describe, expect, it } from "vitest";
import { scoreJobPosting, type JobPostingForMatching, type UserPreferencesForMatching } from "./matching";

const basePosting: JobPostingForMatching = {
  id: "posting-1",
  title: "백엔드 개발자 채용",
  companyName: "테스트컴퍼니",
  regionCode: "11",
  jobCategoryCode: "TMP02",
  companySize: "중소기업",
  salaryMin: 4000,
  salaryMax: 5000,
  sourceUrl: "https://www.work24.go.kr/wk/a/b/1500/empDetailAuthView.do?wantedAuthNo=1",
};

const basePrefs: UserPreferencesForMatching = {
  regions: ["11", "41"],
  jobCategories: ["TMP02"],
  companySize: ["중소기업"],
  salaryMin: 4500,
};

// 가중치를 25/25/25/25로 균등하게 줘서 각 기준 100점 = 전체 25점씩 기여하게 만든다.
const EQUAL_WEIGHTS = { region: 25, job: 25, salary: 25, company_size: 25 };

describe("scoreJobPosting", () => {
  it("모든 기준이 일치하면 100점", () => {
    const result = scoreJobPosting(basePosting, basePrefs, EQUAL_WEIGHTS);
    expect(result.total).toBe(100);
    expect(result.breakdown).toEqual({ region: 100, job: 100, salary: 100, company_size: 100 });
  });

  it("지역이 사용자 선호 지역에 없으면 0점", () => {
    const result = scoreJobPosting({ ...basePosting, regionCode: "26" }, basePrefs, EQUAL_WEIGHTS);
    expect(result.breakdown.region).toBe(0);
  });

  it("직무가 사용자 선호 직무에 없으면 0점", () => {
    const result = scoreJobPosting({ ...basePosting, jobCategoryCode: "TMP05" }, basePrefs, EQUAL_WEIGHTS);
    expect(result.breakdown.job).toBe(0);
  });

  it("공고 최대급여가 사용자 희망 최소급여보다 낮으면 0점", () => {
    const result = scoreJobPosting({ ...basePosting, salaryMax: 4000 }, basePrefs, EQUAL_WEIGHTS);
    expect(result.breakdown.salary).toBe(0);
  });

  it("공고 최대급여가 사용자 희망 최소급여 이상이면 100점", () => {
    const result = scoreJobPosting({ ...basePosting, salaryMax: 4500 }, basePrefs, EQUAL_WEIGHTS);
    expect(result.breakdown.salary).toBe(100);
  });

  it("사용자가 기업규모를 선택하지 않았으면 공고 기업규모와 상관없이 100점", () => {
    const prefsWithoutCompanySize = { ...basePrefs, companySize: null };
    const result = scoreJobPosting(
      { ...basePosting, companySize: "대기업" },
      prefsWithoutCompanySize,
      EQUAL_WEIGHTS
    );
    expect(result.breakdown.company_size).toBe(100);
  });

  it("공고에 기업규모 정보가 없으면(크롤러 미수집) 감점하지 않고 100점", () => {
    const result = scoreJobPosting({ ...basePosting, companySize: null }, basePrefs, EQUAL_WEIGHTS);
    expect(result.breakdown.company_size).toBe(100);
  });

  it("사용자가 선택한 기업규모와 다르면 0점", () => {
    const result = scoreJobPosting({ ...basePosting, companySize: "대기업" }, basePrefs, EQUAL_WEIGHTS);
    expect(result.breakdown.company_size).toBe(0);
  });

  it("가중치가 다르면 전체 점수도 그에 맞게 반영된다", () => {
    // 지역만 0점, 나머지 100점. 가중치 region=40, job=20, salary=20, company_size=20.
    const weights = { region: 40, job: 20, salary: 20, company_size: 20 };
    const result = scoreJobPosting({ ...basePosting, regionCode: "26" }, basePrefs, weights);
    // (0*40 + 100*20 + 100*20 + 100*20) / 100 = 60
    expect(result.total).toBe(60);
  });

  it("직종코드를 추정하지 못한 공고(NULL)는 직무 기준에서 항상 0점", () => {
    const result = scoreJobPosting({ ...basePosting, jobCategoryCode: null }, basePrefs, EQUAL_WEIGHTS);
    expect(result.breakdown.job).toBe(0);
  });

  it("사용자가 희망 최소연봉을 아직 입력하지 않았으면 급여는 감점하지 않는다", () => {
    const prefsWithoutSalary = { ...basePrefs, salaryMin: null };
    const result = scoreJobPosting(basePosting, prefsWithoutSalary, EQUAL_WEIGHTS);
    expect(result.breakdown.salary).toBe(100);
  });
});
