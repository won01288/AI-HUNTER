"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { login, type LoginState } from "./actions";
import { KakaoLoginButton } from "../kakao-login-button";

const initialState: LoginState = {};

// 카카오 콜백이 실패하면 /login?error=코드 형태로 돌아온다.
// 페이지 로드 시점에 이 값을 읽어 사람이 읽을 수 있는 메시지로 바꿔준다.
const KAKAO_ERROR_MESSAGES: Record<string, string> = {
  kakao_privacy: "카카오로 시작하려면 개인정보 수집·이용에 동의해주세요.",
  kakao_failed: "카카오 로그인에 실패했어요. 다시 시도해주세요.",
};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [kakaoError, setKakaoError] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code) setKakaoError(KAKAO_ERROR_MESSAGES[code] ?? null);
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-sm space-y-5 rounded-card border border-line bg-white p-8 shadow-[0_2px_12px_rgba(20,33,61,0.06)]">
        <h1 className="font-display text-xl font-bold text-ink">로그인</h1>

        <form action={formAction} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-line px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-ink px-5 py-2.5 font-medium text-paper disabled:opacity-50"
          >
            {isPending ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-slate">
          <div className="h-px flex-1 bg-line" />
          또는
          <div className="h-px flex-1 bg-line" />
        </div>

        {kakaoError && (
          <p className="text-sm text-red-600" role="alert">
            {kakaoError}
          </p>
        )}
        <KakaoLoginButton from="login" />

        <p className="text-center text-sm text-slate">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-ink underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
