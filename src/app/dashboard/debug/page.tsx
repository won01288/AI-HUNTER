import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getTopMatches } from "@/lib/matching-queries";

// 개발자용 디버그 화면. 특정 user_id의 매칭 breakdown과 크롤링 로그를 보여준다.
// 다른 사용자의 선호도 데이터를 노출할 수 있어서, 배포된(production) 환경에서는
// 아예 접근이 안 되게 최상단에서 막는다 (로컬에서만 확인 가능).
export default async function DashboardDebugPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  await requireUser();

  const { userId: selectedUserId } = await searchParams;

  const [users, runs] = await Promise.all([
    db.execute({ sql: "SELECT id, email, name FROM users ORDER BY created_at DESC LIMIT 50", args: [] }),
    db.execute({
      sql: `SELECT started_at, finished_at, fetched_count, inserted_count, failed_count, error_message
            FROM collection_runs ORDER BY started_at DESC LIMIT 10`,
      args: [],
    }),
  ]);

  const matches = selectedUserId ? await getTopMatches(selectedUserId, 10) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12 text-ink">
      <h1 className="text-xl font-semibold">개발자용 디버그 화면 (로컬 전용)</h1>

      <section className="space-y-3">
        <h2 className="font-medium">사용자별 매칭 breakdown</h2>
        <form className="flex gap-2">
          <select name="userId" defaultValue={selectedUserId ?? ""} className="rounded-lg border border-line px-2 py-1">
            <option value="">사용자 선택</option>
            {users.rows.map((row) => (
              <option key={String(row.id)} value={String(row.id)}>
                {String(row.email ?? row.name ?? row.id)}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg border border-line px-3 py-1 text-sm">
            조회
          </button>
        </form>

        {selectedUserId && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line text-left text-slate">
                  <th className="py-2 pr-3">공고</th>
                  <th className="py-2 pr-3">총점</th>
                  <th className="py-2 pr-3">지역</th>
                  <th className="py-2 pr-3">직무</th>
                  <th className="py-2 pr-3">연봉</th>
                  <th className="py-2 pr-3">기업규모</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match.posting.id} className="border-b border-line">
                    <td className="py-2 pr-3">{match.posting.title}</td>
                    <td className="py-2 pr-3 font-mono">{Math.round(match.total)}</td>
                    <td className="py-2 pr-3 font-mono">{match.breakdown.region}</td>
                    <td className="py-2 pr-3 font-mono">{match.breakdown.job}</td>
                    <td className="py-2 pr-3 font-mono">{match.breakdown.salary}</td>
                    <td className="py-2 pr-3 font-mono">{match.breakdown.company_size}</td>
                  </tr>
                ))}
                {matches.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-3 text-slate">
                      매칭 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">최근 크롤링 실행 로그</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-slate">
                <th className="py-2 pr-3">시작</th>
                <th className="py-2 pr-3">종료</th>
                <th className="py-2 pr-3">조회</th>
                <th className="py-2 pr-3">저장</th>
                <th className="py-2 pr-3">실패</th>
                <th className="py-2 pr-3">에러</th>
              </tr>
            </thead>
            <tbody>
              {runs.rows.map((row, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-2 pr-3 font-mono">{String(row.started_at)}</td>
                  <td className="py-2 pr-3 font-mono">{String(row.finished_at ?? "-")}</td>
                  <td className="py-2 pr-3 font-mono">{String(row.fetched_count)}</td>
                  <td className="py-2 pr-3 font-mono">{String(row.inserted_count)}</td>
                  <td className="py-2 pr-3 font-mono">{String(row.failed_count)}</td>
                  <td className="py-2 pr-3 text-signal">{row.error_message ? String(row.error_message) : "-"}</td>
                </tr>
              ))}
              {runs.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-3 text-slate">
                    아직 실행된 크롤링이 없습니다. `npm run collect:worknet`으로 수동 실행해보세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
