import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const OAUTH_STATE_COOKIE = "kakao_oauth_state";

interface KakaoTokenResponse {
  access_token?: string;
}

interface KakaoUserResponse {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: { nickname?: string };
  };
  properties?: { nickname?: string };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const kakaoError = url.searchParams.get("error");

  const cookieStore = await cookies();
  const savedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  // state가 안 맞으면 CSRF(요청 위조) 의심 상황이라 로그인시키지 않는다.
  // CSRF 시도나 사용자의 카카오 인증 취소로 운영 중에도 발생할 수 있어
  // 원인 추적용으로 로그를 남겨둔다.
  if (kakaoError || !code || !state || state !== savedState) {
    console.error("[kakao callback] 초기 검증 실패", {
      kakaoError,
      hasCode: !!code,
      state,
      savedState,
    });
    return NextResponse.redirect(new URL("/login?error=kakao_failed", url.origin));
  }

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_REST_API_KEY!,
      // 카카오 로그인 > 보안에서 Client Secret을 켠 상태라 토큰 교환 시
      // 필수로 함께 보내야 한다 (안 보내면 invalid_client/KOE010 에러).
      client_secret: process.env.KAKAO_CLIENT_SECRET!,
      redirect_uri: process.env.KAKAO_REDIRECT_URI!,
      code,
    }),
  });
  const tokenData = (await tokenRes.json()) as KakaoTokenResponse;

  if (!tokenData.access_token) {
    // 설정 실수(client_secret 등)나 카카오 서버 장애로 운영 중에도
    // 발생할 수 있어 원인 추적용으로 로그를 남겨둔다.
    console.error("[kakao callback] 토큰 교환 실패", tokenRes.status, tokenData);
    return NextResponse.redirect(new URL("/login?error=kakao_failed", url.origin));
  }

  const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const kakaoUser = (await userRes.json()) as KakaoUserResponse;

  const kakaoId = String(kakaoUser.id);
  // 비즈 앱 전환 심사 전이면 email이 안 올 수 있다 (db-schema.md 설계 메모).
  const email = kakaoUser.kakao_account?.email ?? null;
  const nickname =
    kakaoUser.kakao_account?.profile?.nickname ??
    kakaoUser.properties?.nickname ??
    null;

  const existing = await db.execute({
    sql: "SELECT id, email FROM users WHERE kakao_id = ?",
    args: [kakaoId],
  });

  let userId: string;

  if (existing.rows.length > 0) {
    userId = String(existing.rows[0].id);

    // 처음엔 이메일 없이 가입했다가, 비즈 앱 전환 승인 후 이번 로그인에서
    // 이메일을 받아온 경우 비어있던 값을 채워 넣는다 (db-schema.md 참고).
    // 이미 다른 계정이 쓰는 이메일이면(UNIQUE 제약) 건드리지 않는다.
    if (email && !existing.rows[0].email) {
      const emailTaken = await db.execute({
        sql: "SELECT id FROM users WHERE email = ?",
        args: [email],
      });
      if (emailTaken.rows.length === 0) {
        await db.execute({
          sql: "UPDATE users SET email = ? WHERE id = ?",
          args: [email, userId],
        });
      }
    }
  } else {
    userId = randomUUID();
    const now = new Date().toISOString();

    // 이메일 가입자가 이미 쓰고 있는 이메일과 겹치면 UNIQUE 제약에 걸리므로,
    // 그럴 땐 이메일 없이 카카오 계정만 만든다.
    const emailTaken = email
      ? await db.execute({
          sql: "SELECT id FROM users WHERE email = ?",
          args: [email],
        })
      : null;
    const safeEmail = emailTaken && emailTaken.rows.length > 0 ? null : email;

    // users, user_preferences 두 테이블에 걸쳐 쓰는 작업이라 batch로 묶는다
    // (signup/actions.ts의 이메일 가입 흐름과 동일한 이유).
    await db.batch(
      [
        {
          sql: `INSERT INTO users (id, email, kakao_id, name, auth_provider, privacy_agreed_at)
                VALUES (?, ?, ?, ?, 'kakao', ?)`,
          args: [userId, safeEmail, kakaoId, nickname, now],
        },
        {
          sql: "INSERT INTO user_preferences (user_id) VALUES (?)",
          args: [userId],
        },
      ],
      "write"
    );
  }

  const session = await getSession();
  session.userId = userId;
  await session.save();

  const prefResult = await db.execute({
    sql: "SELECT onboarding_completed_at FROM user_preferences WHERE user_id = ?",
    args: [userId],
  });
  const onboardingCompletedAt = prefResult.rows[0]?.onboarding_completed_at;

  return NextResponse.redirect(
    new URL(
      onboardingCompletedAt ? "/dashboard" : "/onboarding/step1",
      url.origin
    )
  );
}
