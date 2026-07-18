1. Turso 클라이언트 초기화

- src/lib/db.ts: @libsql/client의 createClient로 싱글턴 클라이언트 생성.
Next.js dev 모드 hot-reload 시 커넥션이 중복 생성되지 않도록 globalThis
캐싱 패턴 사용 (Prisma 등에서 쓰는 흔한 패턴 — 이유를 주석으로 남김).
- .env.local의 TURSO_DATABASE_URL을 file:./local.db로 임시 설정.
- .gitignore에 local.db 추가.

2. Phase 1 스키마 테이블 생성

- db/schema.sql: docs/db-schema.md의 users/user_preferences/
priority_weights CREATE TABLE 문 그대로 옮김 (문서와 코드가 어긋나지
않도록 문서를 원본으로 삼음).
- scripts/migrate.mjs: 위 SQL 파일을 읽어 db.ts의 클라이언트로 실행하는
아주 짧은 스크립트 (별도 마이그레이션 프레임워크는 이 규모에 과함 —
순수 SQL 실행으로 충분). package.json에 "db:migrate" 스크립트 추가.

3. 비밀번호 해시 + 세션 유틸리티

- src/lib/password.ts: bcryptjs로 hashPassword/verifyPassword.
- src/lib/session.ts: iron-session 설정(sessionOptions,
SESSION_SECRET 사용)과 getSession(), 로그인 여부 확인 후 없으면
/login으로 보내는 requireUser() 헬퍼. (미들웨어 대신 각 보호된
페이지에서 이 헬퍼를 부르는 방식 — 미들웨어의 Edge 런타임 제약보다
코드 흐름이 명시적이라 초보자가 추적하기 쉬움)

4. 이메일/비밀번호 회원가입

- src/app/signup/page.tsx: 이메일, 비밀번호, 개인정보 수집·이용 동의
체크박스(필수) 폼.
- 처리 로직(Server Action): 이메일 중복 체크 → bcrypt 해시 → users insert
(auth_provider='email', privacy_agreed_at 기록) → 빈 user_preferences
행 동시 생성(user_id만 채움, db-schema.md 설계 메모대로) → 세션 발급 →
/onboarding/step1로 리다이렉트.

5. 이메일/비밀번호 로그인 + 로그아웃

- src/app/login/page.tsx + 로그인 Server Action: 이메일로 조회 → bcrypt
비교 → 세션 발급 → onboarding_completed_at 여부로 /onboarding/step1
또는 /dashboard(자리표시자)로 분기.
- 로그아웃 액션: 세션 파기.

6. 세션 기반 라우트 보호

- /onboarding/*, /dashboard 등 로그인 필요한 페이지 상단에서
requireUser() 호출. 비회원 온보딩 진입 차단 (PRD 원칙).

7. 워크넷 지역/직종 코드 (임시 데이터)

- src/lib/worknet.ts: 지역코드/직종코드 목록을 반환하는 함수. 실제 키가
없으므로 지금은 하드코딩된 대표 목록(시/도 단위 지역코드, 주요 직종코드)을
반환하고, WORKNET_API_KEY 발급 후 실제 API 호출로 교체할 수 있게 함수
시그니처를 분리해둔다. .env.example에 WORKNET_API_KEY= 추가.

8. 1단계 온보딩 폼 (필수 5문항)

- src/app/onboarding/step1/page.tsx: 희망 지역(칩 다중선택), 직무
대분류(드롭다운), 총 경력(숫자), 희망 연봉 범위(슬라이더 2개), 이직
긴급도(단일선택).
- 재방문 시 기존 user_preferences 값으로 폼 초기화.
- 유효성 검사(onboarding-flow.md 기준): salary_min ≤ salary_desired,
지역/직종 최소 1개, 경력 0 이상 정수.
- 완료 시 onboarding_completed_at 기록 → /dashboard(매칭 준비 중 안내
placeholder)로 이동.

9. 2단계 온보딩 폼 (선택 정교화)

- src/app/onboarding/step2/page.tsx: 기업 규모 선호(다중선택),
우선순위 가중치(지역/연봉/직무/기업규모, 합 100), 제외 조건(자유 태그).
- priority_weights 테이블에 criterion별 행 upsert.
- 대시보드에 "더 정확한 추천을 원하시면" 배너로 유도.

10. 카카오 로그인 연동

- src/app/api/auth/kakao/route.ts: 카카오 인가 URL로 리다이렉트.
- src/app/api/auth/kakao/callback/route.ts: 인가코드 → 토큰 교환 → 사용자
정보 조회 → kakao_id로 users upsert(auth_provider='kakao', email은
없을 수 있음) → 빈 user_preferences 없으면 생성 → 세션 발급 → 분기.
- 로그인/가입 페이지에 "카카오로 시작하기" 버튼 추가.
- 실제 동작 테스트는 사용자가 카카오 디벨로퍼스에서 앱을 만들고
KAKAO_REST_API_KEY/KAKAO_REDIRECT_URI를 실제 값으로 채운 뒤 진행
(이 시점에 등록 절차 안내 제공).

건드리지 않는 것

- 워크넷 오픈API 실제 연동, 카카오 "비즈 앱 전환" 신청, Render 배포 —
Phase 1 로드맵에는 있지만 오늘 범위(가입+온보딩 화면 완결)에서 제외.
워크넷/카카오는 외부 콘솔 작업(코드 아님)이 선행돼야 해서 별도로 안내.

검증 방법

- 각 단위마다 npm run build로 컴파일 확인.
- 4~9번 완료 시점에 npm run dev로 실제 브라우저 흐름 확인: 회원가입 →
자동 로그인 → 1단계 온보딩(재방문 이어가기 포함) → 2단계 온보딩 →
로그아웃 → 재로그인 시 온보딩 건너뛰고 대시보드로 가는지까지 눈으로 확인.
- 10번(카카오)은 코드 작성 후 빌드까지만 확인, 실제 로그인 테스트는 카카오
앱 준비 후 별도 진행.