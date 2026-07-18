"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export type Step2State = {
  error?: string;
};

const COMPANY_SIZE_VALUES = ["large", "mid", "small", "startup"] as const;

function parseStringArray(formData: FormData, field: string): string[] {
  const raw = String(formData.get(field) ?? "[]");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v) => typeof v === "string" && v.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

export async function submitStep2(
  _prevState: Step2State,
  formData: FormData
): Promise<Step2State> {
  // 서버 액션은 페이지 렌더와 별개의 요청이라 여기서도 로그인 여부를 다시 확인한다.
  const userId = await requireUser();

  const companySize = parseStringArray(formData, "companySize").filter((v) =>
    COMPANY_SIZE_VALUES.includes(v as (typeof COMPANY_SIZE_VALUES)[number])
  );
  const exclusions = parseStringArray(formData, "exclusions");

  const regionWeight = Number(formData.get("weightRegion"));
  const salaryWeight = Number(formData.get("weightSalary"));
  const jobWeight = Number(formData.get("weightJob"));
  const companySizeWeight = Number(formData.get("weightCompanySize"));

  const weights = [regionWeight, salaryWeight, jobWeight, companySizeWeight];
  if (weights.some((w) => !Number.isInteger(w) || w < 0 || w > 100)) {
    return { error: "우선순위 가중치는 0~100 사이의 정수여야 합니다." };
  }
  if (weights.reduce((sum, w) => sum + w, 0) !== 100) {
    return { error: "우선순위 가중치의 합이 100이 되도록 맞춰주세요." };
  }

  const now = new Date().toISOString();

  // user_preferences 수정 + priority_weights 4개 기준 upsert를 한 번에 묶어
  // 일부만 반영되는 상황을 막는다 (원자성 보장, signup/actions.ts와 같은 패턴).
  await db.batch(
    [
      {
        sql: `UPDATE user_preferences
              SET company_size = ?, exclusions = ?, updated_at = ?
              WHERE user_id = ?`,
        args: [JSON.stringify(companySize), JSON.stringify(exclusions), now, userId],
      },
      {
        sql: `INSERT INTO priority_weights (user_id, criterion, weight)
              VALUES (?, 'region', ?)
              ON CONFLICT(user_id, criterion) DO UPDATE SET weight = excluded.weight`,
        args: [userId, regionWeight],
      },
      {
        sql: `INSERT INTO priority_weights (user_id, criterion, weight)
              VALUES (?, 'salary', ?)
              ON CONFLICT(user_id, criterion) DO UPDATE SET weight = excluded.weight`,
        args: [userId, salaryWeight],
      },
      {
        sql: `INSERT INTO priority_weights (user_id, criterion, weight)
              VALUES (?, 'job', ?)
              ON CONFLICT(user_id, criterion) DO UPDATE SET weight = excluded.weight`,
        args: [userId, jobWeight],
      },
      {
        sql: `INSERT INTO priority_weights (user_id, criterion, weight)
              VALUES (?, 'company_size', ?)
              ON CONFLICT(user_id, criterion) DO UPDATE SET weight = excluded.weight`,
        args: [userId, companySizeWeight],
      },
    ],
    "write"
  );

  redirect("/dashboard");
}
