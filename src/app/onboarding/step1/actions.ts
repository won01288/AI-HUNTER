"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export type Step1State = {
  error?: string;
};

const URGENCY_VALUES = ["immediate", "within_3m", "open"] as const;

function parseCodeArray(formData: FormData, field: string): string[] {
  const raw = String(formData.get(field) ?? "[]");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export async function submitStep1(
  _prevState: Step1State,
  formData: FormData
): Promise<Step1State> {
  // 서버 액션은 페이지 렌더와 별개의 요청이라 여기서도 로그인 여부를 다시 확인한다.
  const userId = await requireUser();

  const regions = parseCodeArray(formData, "regions");
  const jobCategories = parseCodeArray(formData, "jobCategories");
  const experienceYears = Number(formData.get("experienceYears"));
  const salaryMin = Number(formData.get("salaryMin"));
  const salaryDesired = Number(formData.get("salaryDesired"));
  const urgency = String(formData.get("urgency") ?? "");

  if (regions.length === 0) {
    return { error: "희망 근무지역을 1개 이상 선택해주세요." };
  }
  if (jobCategories.length === 0) {
    return { error: "직무 대분류를 1개 이상 선택해주세요." };
  }
  if (!Number.isInteger(experienceYears) || experienceYears < 0) {
    return { error: "총 경력은 0 이상의 정수로 입력해주세요." };
  }
  if (
    !Number.isInteger(salaryMin) ||
    !Number.isInteger(salaryDesired) ||
    salaryMin > salaryDesired
  ) {
    return { error: "희망 연봉 범위를 다시 확인해주세요 (최소 ≤ 희망)." };
  }
  if (!URGENCY_VALUES.includes(urgency as (typeof URGENCY_VALUES)[number])) {
    return { error: "이직 긴급도를 선택해주세요." };
  }

  await db.execute({
    sql: `UPDATE user_preferences
          SET regions = ?, job_categories = ?, experience_years = ?,
              salary_min = ?, salary_desired = ?, urgency = ?,
              onboarding_completed_at = datetime('now'),
              updated_at = datetime('now')
          WHERE user_id = ?`,
    args: [
      JSON.stringify(regions),
      JSON.stringify(jobCategories),
      experienceYears,
      salaryMin,
      salaryDesired,
      urgency,
      userId,
    ],
  });

  redirect("/dashboard");
}
