-- Phase 1 스키마 (docs/db-schema.md가 원본 문서, 이 파일은 그 내용을 그대로 옮긴 것)

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
