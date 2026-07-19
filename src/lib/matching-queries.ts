import { db } from "@/lib/db";
import {
  scoreJobPosting,
  DEFAULT_WEIGHTS,
  type JobPostingForMatching,
  type UserPreferencesForMatching,
  type PriorityWeights,
  type MatchResult,
} from "@/lib/matching";

function parseJsonArray(value: unknown): string[] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

async function loadPreferences(userId: string): Promise<UserPreferencesForMatching> {
  const result = await db.execute({
    sql: `SELECT regions, job_categories, company_size, salary_min
          FROM user_preferences WHERE user_id = ?`,
    args: [userId],
  });
  const row = result.rows[0];

  return {
    regions: parseJsonArray(row?.regions),
    jobCategories: parseJsonArray(row?.job_categories),
    companySize: row?.company_size != null ? parseJsonArray(row.company_size) : null,
    salaryMin: row?.salary_min != null ? Number(row.salary_min) : null,
  };
}

async function loadWeights(userId: string): Promise<PriorityWeights> {
  const result = await db.execute({
    sql: `SELECT criterion, weight FROM priority_weights WHERE user_id = ?`,
    args: [userId],
  });
  if (result.rows.length === 0) return DEFAULT_WEIGHTS;

  const weights = { ...DEFAULT_WEIGHTS };
  for (const row of result.rows) {
    const criterion = String(row.criterion) as keyof PriorityWeights;
    if (criterion in weights) weights[criterion] = Number(row.weight);
  }
  return weights;
}

async function loadPostings(): Promise<JobPostingForMatching[]> {
  const result = await db.execute({
    sql: `SELECT id, title, company_name, region_code, job_category_code,
                 company_size, salary_min, salary_max, source_url
          FROM job_postings`,
    args: [],
  });

  return result.rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    companyName: row.company_name != null ? String(row.company_name) : null,
    regionCode: row.region_code != null ? String(row.region_code) : null,
    jobCategoryCode: row.job_category_code != null ? String(row.job_category_code) : null,
    companySize: row.company_size != null ? String(row.company_size) : null,
    salaryMin: row.salary_min != null ? Number(row.salary_min) : null,
    salaryMax: row.salary_max != null ? Number(row.salary_max) : null,
    sourceUrl: String(row.source_url),
  }));
}

// 사용자 선호도 기준 상위 매칭 공고를 즉석에서 계산한다 (recommendations 테이블 없음,
// docs/db-schema.md 참고). 개발자용 디버그 화면에서도 특정 user_id로 그대로 재사용한다.
export async function getTopMatches(userId: string, limit = 10): Promise<MatchResult[]> {
  const [preferences, weights, postings] = await Promise.all([
    loadPreferences(userId),
    loadWeights(userId),
    loadPostings(),
  ]);

  return postings
    .map((posting) => scoreJobPosting(posting, preferences, weights))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
