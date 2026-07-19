-- Phase 1 스키마 (docs/db-schema.md가 원본 문서, 이 파일은 그 내용을 그대로 옮긴 것)
-- Phase 2 스키마(job_postings, collection_runs)는 docs/roadmap_phase2.md가 원본 문서.
--
-- 모든 CREATE TABLE에 IF NOT EXISTS를 쓰는 이유: 이 스크립트는 버전 관리 없이
-- 전체를 재실행하는 방식이라(scripts/migrate.mjs), 새 테이블 하나를 추가할 때도
-- 이미 있는 테이블까지 다시 실행된다. IF NOT EXISTS가 없으면 기존 테이블에서
-- "table already exists" 에러가 나서 재실행이 막힌다.

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS user_preferences (
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

CREATE TABLE IF NOT EXISTS priority_weights (
  user_id TEXT REFERENCES users(id),
  criterion TEXT NOT NULL,          -- 'region' | 'salary' | 'job' | 'company_size'
  weight INTEGER NOT NULL,          -- 0~100, 사용자별 합계 100
  PRIMARY KEY (user_id, criterion)
);

-- Phase 2 — 워크넷 크롤링 결과 (docs/roadmap_phase2.md 1절)
CREATE TABLE IF NOT EXISTS job_postings (
  id TEXT PRIMARY KEY,              -- 내부 uuid
  source TEXT NOT NULL DEFAULT 'worknet_crawl',
  source_id TEXT NOT NULL,          -- 워크넷 공고 고유번호(wantedAuthNo)
  title TEXT NOT NULL,
  company_name TEXT,
  region_code TEXT,                 -- 워크넷 지역코드
  job_category_code TEXT,           -- 채용제목 키워드로 추정한 TMP01~08 (src/lib/collectors/worknet.ts)
  company_size TEXT,                -- 목록 페이지에 없어 현재는 항상 NULL (매칭 시 미입력과 동일 취급)
  salary_min INTEGER,                -- 단위: 만원 (user_preferences.salary_min과 동일)
  salary_max INTEGER,
  career_min_years INTEGER,
  posted_at TEXT,
  closing_at TEXT,
  source_url TEXT NOT NULL,         -- 원문 링크. 콘텐츠 재게시 금지 원칙상 필수
  collected_at TEXT DEFAULT (datetime('now')),
  UNIQUE(source, source_id)
);

-- Phase 2 — 크롤링 배치 실행 로그 (개발자용 디버그 화면에서 사용)
CREATE TABLE IF NOT EXISTS collection_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);
