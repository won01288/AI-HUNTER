"use client";

import { useEffect, useState } from "react";

// 실제 매칭 데이터가 아닌, 랜딩 히어로용 장식 샘플이다 (docs/design-guide.md).
const TARGET_SCORE = 92;
const ANIMATION_MS = 1400;

export function HeroMatchCard() {
  const [score, setScore] = useState(0);
  const [animateScanLine, setAnimateScanLine] = useState(false);

  useEffect(() => {
    // prefers-reduced-motion이면 카운트업 없이 최종 상태(92%)만 바로 보여준다.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setScore(TARGET_SCORE);
      return;
    }

    setAnimateScanLine(true);
    const startTime = performance.now();
    let frameId: number;

    function tick(now: number) {
      const progress = Math.min((now - startTime) / ANIMATION_MS, 1);
      setScore(Math.round(progress * TARGET_SCORE));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-card border border-line bg-white p-5 shadow-[0_2px_12px_rgba(20,33,61,0.06)]">
      {animateScanLine && <span className="scan-line" aria-hidden />}

      <p className="text-sm text-slate">서울 · IT·개발</p>
      <p className="mt-1 font-mono text-sm text-ink">희망연봉 4,500만원 ↑</p>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-line">
          <div
            className="h-full rounded-full bg-signal"
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="w-11 shrink-0 text-right font-mono text-sm font-medium text-signal">
          {score}%
        </span>
      </div>
    </div>
  );
}
