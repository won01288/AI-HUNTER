# DB 스키마 (Turso / libSQL, SQLite 호환)

Phase 1(온보딩) 범위: users, user_preferences, priority_weights
Phase 2(매칭) 이후: job_postings, recommendations (지금은 만들지 않음, 참고용으로만 남김)

## Phase 1 — 지금 만드는 테이블

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,              -- uuid
  email TEXT UNIQUE,                -- nullable: 카카오 가입 시 비즈앱 심사 전이면 없을 수 있음
  password_hash TEXT,               -- nullable: 카카오 가입자는 비밀번호 없음. bcrypt 해시만 저장, 평문 금지
  kakao_id TEXT UNIQUE,             -- nullable: 카카오 로그인 가입자의 고유 회원번호
  name TEXT,
  auth_provider TEXT NOT NULL,      -- 'email' | 'kakao'
  privacy_agreed_at TEXT NOT NULL,  -- 개인정보 수집·이용 동의 시각, 가입 시 필수 기록
  created_at TEXT DEFAULT (datetime('now'))
);
-- 애플리케이션 레벨 규칙(SQLite는 조건부 제약이 번거로워 코드에서 검증):
--   auth_provider = 'email'  이면 email, password_hash 필수
--   auth_provider = 'kakao'  이면 kakao_id 필수, email/password_hash는 없을 수 있음

CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  regions TEXT,                     -- JSON 배열 문자열, 워크넷 지역코드값. 예: '["11","41"]'
  job_categories TEXT,              -- JSON 배열 문자열, 워크넷 직종코드값
  experience_years INTEGER,
  company_size TEXT,                -- JSON 배열 문자열, 2단계 입력 (nullable)
  salary_min INTEGER,
  salary_desired INTEGER,
  urgency TEXT,                     -- 'immediate' | 'within_3m' | 'open'
  exclusions TEXT,                  -- JSON 배열 문자열 (nullable)
  onboarding_completed_at TEXT,     -- 1단계(필수 5문항) 완료 시각. NULL이면 온보딩 재진입 대상
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE priority_weights (
  user_id TEXT REFERENCES users(id),
  criterion TEXT NOT NULL,          -- 'region' | 'salary' | 'job' | 'company_size'
  weight INTEGER NOT NULL,          -- 0~100, 사용자별 합계 100
  PRIMARY KEY (user_id, criterion)
);
```

## Phase 2 — 실제 정의 (docs/roadmap_phase2.md 참고)

`job_postings` 테이블 정의와 매칭 스코어링 방식은 docs/roadmap_phase2.md에
있다. 매칭 결과는 요청 시점에 즉석 계산하므로 별도 recommendations 테이블은
Phase 2에서 만들지 않는다 (Phase 3에서 알림 발송 이력용으로 추가 예정).


## 설계 메모
- JSON을 문자열 컬럼에 저장하는 이유: SQLite/Turso는 네이티브 배열 타입이
  없어 애플리케이션 레벨에서 JSON.stringify / JSON.parse로 다룬다.
- 개인정보 암호화, soft delete 등은 Phase 1에서 구현하지 않는다
  (CLAUDE.md 규칙 참고). 컬럼 설계만 확장 여지를 남겨둔다.
- `user_preferences`의 선호도 컬럼들을 NOT NULL로 걸지 않은 이유: 가입
  직후 빈 레코드를 만들고 1단계 폼을 진행하면서 하나씩 채워나가는 구조라서.
  `onboarding_completed_at`이 채워졌는지로 "필수 5문항 입력 완료" 여부를
  판단하고, 애플리케이션 레벨에서 완료 시점에 5개 필드 유효성을 검사한다.
- `priority_weights`에 레코드가 없는 사용자는 기본값(25/25/25/25 균등
  배분)으로 간주한다 — 매칭 로직에서 처리, DB에 기본 행을 미리 넣지 않는다
  (docs/onboarding-flow.md 참고).
- `users.email`을 nullable로 둔 이유: 카카오 로그인은 "비즈 앱 전환"
  심사를 통과하기 전까지 이메일 동의항목을 받을 수 없다. 심사 승인 전에도
  가입 흐름이 끊기지 않도록 `kakao_id`만으로 계정을 식별할 수 있게 했다.
  심사가 통과되면 이후 로그인 시점에 email을 채워 넣는 방식으로 보완한다.
