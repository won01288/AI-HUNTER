"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="flex flex-1 items-center justify-center bg-paper px-4 py-16">
      <form
        action={formAction}
        className="w-full max-w-sm space-y-5 rounded-card border border-line bg-white p-8 shadow-[0_2px_12px_rgba(20,33,61,0.06)]"
      >
        <h1 className="font-display text-xl font-bold text-ink">로그인</h1>

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

        <p className="text-center text-sm text-slate">
          아직 계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-ink underline">
            회원가입
          </Link>
        </p>
      </form>
    </div>
  );
}
