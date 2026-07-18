import { requireUser } from "@/lib/session";
import { logout } from "@/app/login/actions";

// 실제 매칭 결과 화면은 Phase 2에서 구현. 지금은 로그인 후 도착하는
// 자리표시자이자, 세션 보호가 정상 동작하는지 확인하는 용도.
export default async function DashboardPage() {
  await requireUser();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 py-16 text-center dark:bg-black">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          맞춤 채용정보 안내 준비 중
        </h1>
        <p className="max-w-sm text-sm text-zinc-500">
          입력해주신 선호도를 바탕으로 채용정보를 정리하는 기능은 곧
          제공됩니다.
        </p>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          로그아웃
        </button>
      </form>
    </div>
  );
}
