"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/session";

export type SignupState = {
  error?: string;
};

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const privacyAgreed = formData.get("privacyAgreed") === "on";

  if (!email || !password) {
    return { error: "이메일과 비밀번호를 모두 입력해주세요." };
  }
  if (password.length < 8) {
    return { error: "비밀번호는 8자 이상이어야 합니다." };
  }
  if (!privacyAgreed) {
    return { error: "개인정보 수집·이용에 동의해야 가입할 수 있습니다." };
  }

  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [email],
  });
  if (existing.rows.length > 0) {
    return { error: "이미 가입된 이메일입니다." };
  }

  const passwordHash = await hashPassword(password);
  const userId = randomUUID();
  const now = new Date().toISOString();

  // users, user_preferences 두 테이블에 걸쳐 쓰는 작업이라 batch로 묶어
  // 하나가 실패하면 둘 다 반영되지 않도록 한다 (원자성 보장).
  await db.batch(
    [
      {
        sql: `INSERT INTO users (id, email, password_hash, auth_provider, privacy_agreed_at)
              VALUES (?, ?, ?, 'email', ?)`,
        args: [userId, email, passwordHash, now],
      },
      {
        sql: "INSERT INTO user_preferences (user_id) VALUES (?)",
        args: [userId],
      },
    ],
    "write"
  );

  const session = await getSession();
  session.userId = userId;
  await session.save();

  redirect("/onboarding/step1");
}
