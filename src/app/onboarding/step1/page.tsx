import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getRegionCodes, getJobCategoryCodes } from "@/lib/worknet";
import { Step1Form } from "./step1-form";

// JSON 배열 문자열 컬럼(regions, job_categories)을 안전하게 파싱한다.
// 가입 직후에는 아직 아무것도 입력하지 않아 값이 NULL일 수 있다.
function parseJsonArray(value: unknown): string[] {
  if (typeof value !== "string" || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export default async function OnboardingStep1Page() {
  const userId = await requireUser();

  const [regionCodes, jobCategoryCodes, prefResult] = await Promise.all([
    getRegionCodes(),
    getJobCategoryCodes(),
    db.execute({
      sql: `SELECT regions, job_categories, experience_years,
                   salary_min, salary_desired, urgency
            FROM user_preferences WHERE user_id = ?`,
      args: [userId],
    }),
  ]);

  const row = prefResult.rows[0];

  return (
    <Step1Form
      regionCodes={regionCodes}
      jobCategoryCodes={jobCategoryCodes}
      initialValues={{
        regions: parseJsonArray(row?.regions),
        jobCategories: parseJsonArray(row?.job_categories),
        experienceYears:
          row?.experience_years != null ? Number(row.experience_years) : null,
        salaryMin: row?.salary_min != null ? Number(row.salary_min) : null,
        salaryDesired:
          row?.salary_desired != null ? Number(row.salary_desired) : null,
        urgency: typeof row?.urgency === "string" ? row.urgency : null,
      }}
    />
  );
}
