import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// 카카오 인가 화면으로 넘어갔다가 돌아왔을 때 요청 위조(CSRF)가 아닌지
// 확인하기 위한 값을 잠깐 담아두는 쿠키. state 값이 일치할 때만 콜백에서
// 로그인을 진행한다.
const OAUTH_STATE_COOKIE = "kakao_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from") === "signup" ? "signup" : "login";
  const privacyAgreed = url.searchParams.get("privacyAgreed") === "on";

  // 카카오 자체 동의 화면과는 별개로, 우리 서비스 개인정보 수집·이용
  // 동의도 필수다 (docs/onboarding-flow.md 0단계 방식 B 참고).
  // 체크 안 하고 눌렀으면 카카오로 보내지 않고 원래 페이지로 돌려보낸다.
  if (!privacyAgreed) {
    return NextResponse.redirect(
      new URL(`/${from}?error=kakao_privacy`, url.origin)
    );
  }

  const state = randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 5, // 카카오 인가 화면 왔다갔다 하는 몇 분만 유효하면 됨
    path: "/",
  });

  const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", process.env.KAKAO_REST_API_KEY!);
  authorizeUrl.searchParams.set(
    "redirect_uri",
    process.env.KAKAO_REDIRECT_URI!
  );
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);

  return NextResponse.redirect(authorizeUrl);
}
