// 로그인/가입 페이지 공통 카카오 버튼.
// 서버 액션이 아니라 카카오 인가 화면(외부 URL)으로 이동해야 하므로,
// GET 방식 <form>으로 /api/auth/kakao 라우트를 호출한다.
export function KakaoLoginButton({ from }: { from: "login" | "signup" }) {
  return (
    <form action="/api/auth/kakao" method="GET" className="space-y-2">
      <input type="hidden" name="from" value={from} />

      <label className="flex items-start gap-2 text-sm text-slate">
        <input
          type="checkbox"
          name="privacyAgreed"
          value="on"
          required
          className="mt-1"
        />
        <span>
          (필수) 카카오 로그인 시에도 개인정보 수집·이용에 동의합니다.
          맞춤 채용정보 안내 목적으로만 사용됩니다.
        </span>
      </label>

      {/* 배경/글자색은 디자인 가이드 팔레트가 아니라 카카오 로그인 버튼
          브랜드 가이드 색상(#FEE500 / #191600)을 그대로 따른다. */}
      <button
        type="submit"
        className="w-full rounded-lg bg-[#FEE500] px-5 py-2.5 font-medium text-[#191600]"
      >
        카카오로 시작하기
      </button>
    </form>
  );
}
