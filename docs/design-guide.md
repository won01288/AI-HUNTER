# 디자인 가이드 — AI Hunter

## 컨셉
"막연한 이직 고민에 정확한 좌표를 찍어주는 파트너." 트리플의 "나를 아는
여행 앱"처럼 개인화된 1인칭 톤을 가져오되, 소재는 사진(여행)이 아니라
데이터(매칭 스코어·연봉·지역)가 주인공이 되도록 새로 설계했다.
컬러·비주얼은 트리플을 따르지 않고, "정확한 발견"이라는 감정에 맞춰 별도 정의.

## 컬러 팔레트

| 이름 | 값 | 용도 |
|---|---|---|
| Ink | `#14213D` | 제목, 다크 섹션 배경, 기본 버튼 |
| Paper | `#F6F5F1` | 기본 배경 (웜 뉴트럴) |
| Signal | `#D9A441` | 매칭 스코어·핵심 CTA (화면당 1~2곳만) |
| Pine | `#2F5D50` | 보조 강조 (성장/안정 태그) |
| Slate | `#6B6F76` | 보조 텍스트 |
| Line | `#E2DFD6` | 테두리, 구분선 |

Signal(골드)은 남발하지 않는다 — 가장 중요한 숫자 하나에만 써야 "발견"의
임팩트가 산다.

## 타이포그래피

| 역할 | 폰트 | 용도 |
|---|---|---|
| Display | Noto Serif KR (600/700) | 헤드라인·섹션 타이틀. 세리프로 전문성 표현 |
| Body | Pretendard (400/500) | 본문·폼·UI 전반 |
| Mono | JetBrains Mono (500) | 연봉·매칭률(%)·경력 연차 — "원본 데이터" 느낌 |

본문까지 세리프를 쓰지 않는다. Pretendard는 Google Fonts에 없어
`next/font/local`로 로드한다 (파일: github.com/orioncactus/pretendard).

## 레이아웃 원칙
- 카드형(radius 14px, 옅은 그림자) 기본. 사진 대신 데이터 요약이
  카드의 대부분을 채운다 (지역/연봉/매칭률을 한눈에 스캔 가능하게).
- 매칭 추천 리스트는 실제 순위 데이터이므로 번호(01, 02...) 사용 가능.
  순위와 무관한 섹션(서비스 소개 등)에는 번호를 붙이지 않는다.
- 히어로는 설명 대신, 매칭 카드가 스캔되어 스코어가 채워지는 모습으로
  연다 (아래 시그니처 참고).

## 시그니처 요소 — 스캔 라인
"헌터가 목표를 포착한다"는 개념을, 카드 테두리를 얇은 골드 라인이
한 번 스윕하며 매칭 스코어가 0→92%로 카운트업되는 모션으로 표현한다.
랜딩 히어로와 "새 추천 도착" 두 곳에만 쓰고, 그 외 버튼 hover 등은
모션을 최소화한다. `prefers-reduced-motion`이면 카운트업 없이 최종
상태(92%)만 바로 보여준다.

## 컴포넌트 스니펫

```
버튼(기본):  bg-ink text-paper rounded-lg px-5 py-2.5 font-medium
버튼(CTA):   bg-signal text-ink rounded-lg px-5 py-2.5 font-semibold
카드:        bg-white border border-line rounded-[14px]
             shadow-[0_2px_12px_rgba(20,33,61,0.06)] p-5
스코어 배지: font-mono text-signal text-sm font-medium
인풋:        border border-line rounded-lg px-4 py-2.5
             focus:ring-2 focus:ring-ink/20 focus:border-ink
```

## Tailwind 설정

```js
theme: {
  extend: {
    colors: { ink: '#14213D', paper: '#F6F5F1', signal: '#D9A441',
              pine: '#2F5D50', slate: '#6B6F76', line: '#E2DFD6' },
    fontFamily: {
      display: ['var(--font-display)', 'serif'],
      body: ['var(--font-body)', 'sans-serif'],
      mono: ['var(--font-mono)', 'monospace'],
    },
    borderRadius: { card: '14px' },
  },
},
```

## 카피 톤앤매너

| 상황 | 예시 |
|---|---|
| 랜딩 헤드라인 | "막연한 이직 고민에, 정확한 좌표를 찍어드립니다" |
| 온보딩 시작 | "1분이면 충분해요. 몇 가지만 알려주시면 시작할게요." |
| 빈 상태 | "아직 준비 중이에요. 선호도를 조금 더 채워주시면 더 정확해져요." |
| 매칭 결과 | "○○님 조건과 92% 맞는 공고를 찾았어요" |
| 오류 | "저장에 실패했어요. 다시 시도해 주세요." |

"취업추천", "취업지원" 문구는 CLAUDE.md 규칙대로 쓰지 않는다.

## 체크리스트
- [ ] 모바일(360px) 우선, 카드 리스트는 모바일에서 1열
- [ ] 키보드 포커스 상태 명확히 표시 (`focus:ring`)
- [ ] `prefers-reduced-motion` 대응
- [ ] Signal(#D9A441) vs Ink(#14213D) 대비 확인 후 사용
- [ ] 적용 범위: 랜딩·가입/로그인·온보딩 1·2단계 (매칭 화면은 Phase 2)
