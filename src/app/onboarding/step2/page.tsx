import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Step2Form } from "./step2-form";

// JSON 배열 문자열 컬럼(company_size, exclusions)을 안전하게 파싱한다.
function parseJsonArray(value: unknown): string[] {
  if (typeof value !== "string" || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

// priority_weights에 criterion별 행이 없으면 균등 배분(25씩)으로 간주한다
// (db-schema.md 설계 메모 — DB에 기본값을 미리 넣어두지 않는 정책).
const DEFAULT_WEIGHT = 25;

export default async function OnboardingStep2Page() {
  const userId = await requireUser();

  const [prefResult, weightsResult] = await Promise.all([
    db.execute({
      sql: `SELECT company_size, exclusions FROM user_preferences WHERE user_id = ?`,
      args: [userId],
    }),
    db.execute({
      sql: `SELECT criterion, weight FROM priority_weights WHERE user_id = ?`,
      args: [userId],
    }),
  ]);

  const prefRow = prefResult.rows[0];
  const weightByCriterion = new Map(
    weightsResult.rows.map((row) => [String(row.criterion), Number(row.weight)])
  );

  return (
    <Step2Form
      initialValues={{
        companySize: parseJsonArray(prefRow?.company_size),
        exclusions: parseJsonArray(prefRow?.exclusions),
        weights: {
          region: weightByCriterion.get("region") ?? DEFAULT_WEIGHT,
          salary: weightByCriterion.get("salary") ?? DEFAULT_WEIGHT,
          job: weightByCriterion.get("job") ?? DEFAULT_WEIGHT,
          companySize: weightByCriterion.get("company_size") ?? DEFAULT_WEIGHT,
        },
      }}
    />
  );
}
