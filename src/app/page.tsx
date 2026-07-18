import Link from "next/link";
import { HeroMatchCard } from "./hero-match-card";

const HOW_IT_WORKS = [
  {
    title: "선호도 입력",
    description:
      "지역, 직무, 경력, 희망연봉 등 몇 가지만 알려주세요. 1분이면 충분해요.",
  },
  {
    title: "데이터 재모델링",
    description:
      "워크넷 등 채용정보를 요청 시점에 실시간으로 가공해 나에게 맞는 조건으로 정리합니다.",
  },
  {
    title: "맞춤 채용정보 안내",
    description:
      "로그인한 나에게만, 정리된 요약과 원본 출처 링크를 함께 보여드려요.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-bold text-ink">
          AI Hunter
        </span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-slate hover:text-ink">
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-ink px-4 py-2 font-medium text-paper"
          >
            시작하기
          </Link>
        </nav>
      </header>

      {/* 히어로 */}
      <section className="mx-auto flex w-full max-w-5xl flex-col-reverse items-center gap-10 px-6 py-16 md:flex-row md:justify-between md:py-24">
        <div className="max-w-md text-center md:text-left">
          <h1 className="font-display text-3xl font-bold leading-snug text-ink md:text-4xl">
            막연한 이직 고민에,
            <br />
            정확한 좌표를 찍어드립니다
          </h1>
          <p className="mt-4 text-slate">
            지역·직무·경력·희망연봉을 알려주시면, 채용정보를 재가공해 나에게
            맞는 이직처를 정리해드려요.
          </p>
          <div className="mt-8 flex justify-center gap-3 md:justify-start">
            <Link
              href="/signup"
              className="rounded-lg bg-signal px-5 py-2.5 font-semibold text-ink"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-line px-5 py-2.5 font-medium text-ink"
            >
              로그인
            </Link>
          </div>
        </div>

        <HeroMatchCard />
      </section>

      {/* 어떻게 동작하나요 */}
      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-5xl px-6">
          <h2 className="text-center font-display text-2xl font-semibold text-ink">
            어떻게 동작하나요
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step) => (
              <div
                key={step.title}
                className="rounded-card border border-line bg-paper p-5"
              >
                <h3 className="font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm text-slate">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 마무리 CTA */}
      <section className="bg-ink py-16 text-center">
        <div className="mx-auto w-full max-w-md px-6">
          <h2 className="font-display text-2xl font-semibold text-paper">
            1분이면 충분해요
          </h2>
          <p className="mt-3 text-sm text-paper/70">
            몇 가지만 알려주시면 시작할게요.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-lg bg-signal px-5 py-2.5 font-semibold text-ink"
          >
            시작하기
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 py-8 text-center text-xs text-slate">
        © 2026 AI Hunter
      </footer>
    </div>
  );
}
