"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { getSession } from "@/lib/session";

export type LoginState = {
  error?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해주세요." };
  }

  const result = await db.execute({
    sql: "SELECT id, password_hash FROM users WHERE email = ?",
    args: [email],
  });
  const user = result.rows[0];

  // 이메일이 없거나 카카오 가입자(password_hash 없음)인 경우도
  // "이메일 또는 비밀번호가 올바르지 않습니다"로 동일하게 응답한다.
  // (존재하는 이메일인지 여부를 응답 차이로 노출하지 않기 위함)
  if (!user || !user.password_hash) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const isValid = await verifyPassword(password, String(user.password_hash));
  if (!isValid) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  const session = await getSession();
  session.userId = String(user.id);
  await session.save();

  const prefResult = await db.execute({
    sql: "SELECT onboarding_completed_at FROM user_preferences WHERE user_id = ?",
    args: [user.id],
  });
  const onboardingCompletedAt = prefResult.rows[0]?.onboarding_completed_at;

  redirect(onboardingCompletedAt ? "/dashboard" : "/onboarding/step1");
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
