"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, type SignupState } from "./actions";

const initialState: SignupState = {};

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-paper px-4 py-16">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-card border border-line bg-white p-8 shadow-[0_2px_12px_rgba(20,33,61,0.06)]"
      >
        <h1 className="font-display text-xl font-bold text-ink">회원가입</h1>

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
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-line px-4 py-2.5 text-sm text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20"
          />
          <p className="text-xs text-slate">8자 이상 입력해주세요.</p>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate">
          <input
            type="checkbox"
            name="privacyAgreed"
            required
            className="mt-1"
          />
          <span>
            (필수) 개인정보 수집·이용에 동의합니다. 수집 항목: 이메일,
            비밀번호(해시). 맞춤 채용정보 안내 목적으로만 사용됩니다.
          </span>
        </label>

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
          {isPending ? "가입 중..." : "가입하기"}
        </button>

        <p className="text-center text-sm text-slate">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-ink underline">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
