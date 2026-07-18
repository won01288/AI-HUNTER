import { requireUser } from "@/lib/session";

// 실제 정교화 폼은 9번 작업(2단계 온보딩 폼)에서 채운다.
// 지금은 비회원 접근을 막는 세션 보호(requireUser)만 확인하는 자리표시자.
export default async function OnboardingStep2Page() {
  await requireUser();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <p className="text-sm text-zinc-500">2단계 온보딩 폼 준비 중</p>
    </div>
  );
}
