// docs/design-guide.md의 카드 스펙(rounded-card, border-line, 그림자)과
// hero-match-card.tsx의 매칭 스코어 배지 스타일을 재사용한다.
// 스캔 라인 모션은 랜딩 히어로·"새 추천 도착" 전용이라 여기서는 쓰지 않는다
// (design-guide.md: "남용 금지").

export interface MatchCardProps {
  title: string;
  companyName: string | null;
  regionName: string | null;
  jobCategoryName: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  score: number;
  sourceUrl: string;
}

function formatSalary(min: number | null, max: number | null): string {
  if (min == null && max == null) return "급여 정보 없음";
  if (min != null && max != null && min !== max) return `${min}~${max}만원`;
  return `${min ?? max}만원`;
}

export function MatchCard({
  title,
  companyName,
  regionName,
  jobCategoryName,
  salaryMin,
  salaryMax,
  score,
  sourceUrl,
}: MatchCardProps) {
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-[0_2px_12px_rgba(20,33,61,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate">
            {[regionName, jobCategoryName].filter(Boolean).join(" · ") || "조건 정보 없음"}
          </p>
          <p className="mt-1 font-medium text-ink">{companyName ?? "기업명 비공개"}</p>
          <p className="mt-1 text-sm text-ink">{title}</p>
        </div>
        <span className="shrink-0 font-mono text-sm font-medium text-signal">{Math.round(score)}%</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-sm text-ink">{formatSalary(salaryMin, salaryMax)}</span>
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-pine underline underline-offset-2"
        >
          원문 보기
        </a>
      </div>
    </div>
  );
}
