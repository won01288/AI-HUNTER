# Phase 2 — 데이터 연동 및 매칭

## 목표
워크넷 웹사이트를 크롤링해 채용정보를 수집하고, 사용자 선호도와 단순
규칙으로 매칭해 상위 10개를 사용자 화면에 보여준다.

## 이번 Phase에서 하지 않는 것
- 원티드 등 API 기반 소스 추가 (베타 이후 검토)
- 사람인/잡코리아 등 다중 상업 사이트 수집 (추후 확장)
- 정교한 스코어링(지역 인접도, 연봉 겹침비율) — 지금은 일치/불일치 0·100만
- 추천 이력 영구 저장·알림 발송 (Phase 3에서 다룸)

## 0. 사전 준비
- [ ] 워크넷 채용정보 검색/상세 페이지 URL 구조 확인, robots.txt 확인
      (과도한 요청으로 차단당하지 않기 위한 기술적 확인)
- [ ] 워크넷 지역코드·직종코드 목록 확보 (온보딩에서 이미 쓰고 있으므로
      새로 매핑할 필요 없음, docs/onboarding-flow.md 참고)

## 1. job_postings 테이블

```sql
CREATE TABLE job_postings (
  id TEXT PRIMARY KEY,              -- 내부 uuid
  source TEXT NOT NULL DEFAULT 'worknet_crawl',
  source_id TEXT NOT NULL,          -- 워크넷 공고 고유번호
  title TEXT NOT NULL,
  company_name TEXT,
  region_code TEXT,                 -- 워크넷 지역코드
  job_category_code TEXT,           -- 워크넷 직종코드
  company_size TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  career_min_years INTEGER,
  posted_at TEXT,
  closing_at TEXT,
  source_url TEXT NOT NULL,         -- 원문 링크. 콘텐츠 재게시 금지 원칙상 필수
  collected_at TEXT DEFAULT (datetime('now')),
  UNIQUE(source, source_id)
);
```

`source` 컬럼은 지금 값이 하나뿐이지만, 나중에 소스를 추가할 여지를
남겨두기 위해 고정 문자열 대신 컬럼으로 둔다. 코드값은 워크넷 기준
그대로 쓰므로 별도 매핑 작업이 필요 없다.

## 2. 크롤링 파이프라인
- Render Cron Job, 1일 1회
- 목록 페이지 → 상세 페이지 순으로 파싱. 파서 로직은 별도 함수로 분리해
  워크넷 페이지 구조가 바뀌어도 그 함수만 고치면 되게 만든다
  (`collectors/worknet.ts` 하나의 모듈로 관리)
- `User-Agent` 명시, 요청 사이 적절한 딜레이 (차단 방지 + 서버 부담 최소화)
- `closing_at` 지난 공고는 배치마다 정리(삭제)
- 실패 시 재시도 1회, 그래도 실패하면 로그만 남기고 다음 배치로 넘김

## 3. 매칭 스코어링 (단순 규칙, MVP)

기준별로 0 또는 100점만 준다. 최종 점수 = 기준별 점수 × 가중치(%) 합산.

| 기준 | 100점 조건 | 0점 조건 |
|---|---|---|
| 지역 | 공고 region_code가 사용자 regions에 포함 | 미포함 |
| 직무 | 공고 job_category_code가 사용자 job_categories에 포함 | 미포함 |
| 연봉 | 공고 salary_max ≥ 사용자 salary_min | 미달 |
| 기업규모 | 사용자 미입력 또는 공고 company_size가 사용자 선택에 포함 | 선택했는데 불일치 |

가중치는 `priority_weights`에서 가져오고, 레코드가 없으면 25/25/25/25로
간주한다.

```
match_score = Σ (기준별 0or100 × weight/100)
```

계산은 요청 시점에 즉석으로 한다. 사용자가 대시보드에 들어올 때
`job_postings`를 조회해 그 자리에서 점수를 매기고 상위 10개만 정렬해서
반환한다.

## 4. 사용자용 매칭 결과 화면
- design-guide.md의 카드 컴포넌트·매칭 스코어 배지·스캔 라인 시그니처를
  그대로 사용한다.
- 카드 1개 = 공고 1개: 기업명, 지역, 직무, 연봉 범위, 매칭률(%),
  "원문 보기" 링크(source_url, 새 탭)
- 상위 10개가 없으면(매칭 점수 전부 0) 빈 상태 카피 사용.

## 5. 개발자용 내부 대시보드
사용자용 화면과 같은 매칭 함수를 재사용하되, 특정 user_id를 골라
점수 breakdown까지 표로 보여준다. 크롤러 수집 성공/실패 로그도 같이
보여줘서 문제 발생 시 바로 확인할 수 있게 한다.

## 6. 구현 순서 체크리스트
- [x] 워크넷 크롤러 작성 — 실제로는 목록 페이지 GET에 검색조건을 쿼리파라미터로
      붙이면 상세페이지 없이도 필요한 필드가 거의 다 나와서, 상세 페이지 파싱
      단계는 생략함 (src/lib/collectors/worknet.ts 상단 주석 참고)
- [x] job_postings 테이블 생성 + upsert 배치 스크립트 (scripts/collect-worknet.mjs)
- [ ] Render Cron Job 등록 — 수동 실행(`npm run collect:worknet`)으로 데이터가
      채워지는 것까지는 확인함. Render 대시보드에 크론으로 등록하는 건
      배포 설정이라 별도로 사람이 해야 함
- [x] 매칭 스코어링 함수 작성 (순수 함수, src/lib/matching.ts) 및 단위테스트
      (src/lib/matching.test.ts, vitest 11개 케이스)
- [x] 사용자 대시보드에 매칭 카드 리스트 연결
- [x] 개발자용 디버그 화면에 breakdown + 수집 로그 표시 (NODE_ENV=production이면
      404, 로컬에서만 접근 가능)

## 7. 계획 대비 실제 구현에서 달라진 점
- **직종코드**: 실제 work24 직종 선택 UI가 팝업 트리라 URL에 코드가 노출되지
  않고, 온보딩의 TMP01~08도 원래 자리표시자였다. 채용제목 키워드로 TMP01~08을
  추정하는 방식으로 대체했다 (src/lib/collectors/worknet.ts의
  `classifyJobCategory`). 정확도는 낮은 근사치.
- **기업규모**: 목록 페이지에 노출되지 않아 항상 NULL로 저장된다. 매칭 시
  "정보 없음"은 감점하지 않고 100점 처리한다 (사용자 미입력과 동일 취급).
- **상세 페이지 파싱 생략**: 위 6절 참고.
