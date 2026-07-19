import Link from "next/link";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { logout } from "@/app/login/actions";
import { getTopMatches } from "@/lib/matching-queries";
import { getRegionCodes, getJobCategoryCodes } from "@/lib/worknet";
import { MatchCard } from "./match-card";

export default async function DashboardPage() {
  const userId = await requireUser();

  // priority_weights에 행이 하나도 없으면 2단계(선택 정교화)를 아직
  // 진행하지 않은 것으로 보고 유도 배너를 보여준다.
  const weightsResult = await db.execute({
    sql: "SELECT 1 FROM priority_weights WHERE user_id = ? LIMIT 1",
    args: [userId],
  });
  const hasRefinedPreferences = weightsResult.rows.length > 0;

  const [matches, regionCodes, jobCategoryCodes] = await Promise.all([
    getTopMatches(userId),
    getRegionCodes(),
    getJobCategoryCodes(),
  ]);
  const regionNameByCode = new Map(regionCodes.map((r) => [r.code, r.name]));
  const jobCategoryNameByCode = new Map(jobCategoryCodes.map((j) => [j.code, j.name]));

  // 점수가 전부 0이면 목록을 보여주는 대신 빈 상태 카피를 보여준다
  // (docs/roadmap_phase2.md 4절).
  const meaningfulMatches = matches.filter((match) => match.total > 0);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-paper px-4 py-16">
      <div className="w-full max-w-sm space-y-2 text-center">
        <h1 className="text-xl font-semibold text-ink">맞춤 채용정보 안내</h1>
        <p className="text-sm text-slate">
          입력해주신 선호도를 바탕으로 정리한 채용정보예요.
        </p>
      </div>

      {!hasRefinedPreferences && (
        <Link
          href="/onboarding/step2"
          className="w-full max-w-sm rounded-lg border border-line bg-white px-4 py-3 text-center text-sm text-ink"
        >
          더 정확한 추천을 원하시면 우선순위를 설정해보세요 →
        </Link>
      )}

      {meaningfulMatches.length === 0 ? (
        <p className="max-w-sm text-center text-sm text-slate">
          아직 준비 중이에요. 선호도를 조금 더 채워주시면 더 정확해져요.
        </p>
      ) : (
        <div className="w-full max-w-sm space-y-3">
          {meaningfulMatches.map((match) => (
            <MatchCard
              key={match.posting.id}
              title={match.posting.title}
              companyName={match.posting.companyName}
              regionName={
                match.posting.regionCode
                  ? regionNameByCode.get(match.posting.regionCode) ?? null
                  : null
              }
              jobCategoryName={
                match.posting.jobCategoryCode
                  ? jobCategoryNameByCode.get(match.posting.jobCategoryCode) ?? null
                  : null
              }
              salaryMin={match.posting.salaryMin}
              salaryMax={match.posting.salaryMax}
              score={match.total}
              sourceUrl={match.posting.sourceUrl}
            />
          ))}
        </div>
      )}

      <form action={logout}>
        <button
          type="submit"
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
