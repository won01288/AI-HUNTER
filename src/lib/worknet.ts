// 워크넷 공통코드(지역/직종) 조회.
//
// WORKNET_API_KEY가 아직 없어서 지금은 하드코딩된 대표 목록을 반환한다.
// 키 발급 후에는 이 파일 안의 함수 구현만 실제 API 호출로 바꾸면 되고,
// 호출하는 쪽(온보딩 폼) 코드는 그대로 두면 되도록 함수 시그니처를
// 미리 실제 API 응답 형태(비동기, code/name 배열)에 맞춰뒀다.

export interface WorknetCode {
  code: string;
  name: string;
}

// 시/도 단위 지역코드. 행정표준코드(통계청 시도코드) 기준이라
// 워크넷 지역코드와 값이 같다 (db-schema.md의 "11", "41" 예시와 일치).
const REGION_CODES: WorknetCode[] = [
  { code: "11", name: "서울" },
  { code: "26", name: "부산" },
  { code: "27", name: "대구" },
  { code: "28", name: "인천" },
  { code: "29", name: "광주" },
  { code: "30", name: "대전" },
  { code: "31", name: "울산" },
  { code: "36", name: "세종" },
  { code: "41", name: "경기" },
  { code: "42", name: "강원" },
  { code: "43", name: "충북" },
  { code: "44", name: "충남" },
  { code: "45", name: "전북" },
  { code: "46", name: "전남" },
  { code: "47", name: "경북" },
  { code: "48", name: "경남" },
  { code: "50", name: "제주" },
];

// 직종 대분류 임시 목록. 워크넷 실제 직종코드 체계와 다를 수 있으므로
// WORKNET_API_KEY 발급 후 반드시 실제 공통코드 API 응답으로 교체할 것.
const JOB_CATEGORY_CODES: WorknetCode[] = [
  { code: "TMP01", name: "경영·사무" },
  { code: "TMP02", name: "IT·개발" },
  { code: "TMP03", name: "영업·마케팅" },
  { code: "TMP04", name: "생산·제조" },
  { code: "TMP05", name: "서비스" },
  { code: "TMP06", name: "디자인" },
  { code: "TMP07", name: "연구개발" },
  { code: "TMP08", name: "교육" },
];

export async function getRegionCodes(): Promise<WorknetCode[]> {
  // TODO(worknet): WORKNET_API_KEY 발급 후 공통코드 API 호출로 교체
  return REGION_CODES;
}

export async function getJobCategoryCodes(): Promise<WorknetCode[]> {
  // TODO(worknet): WORKNET_API_KEY 발급 후 공통코드 API 호출로 교체
  return JOB_CATEGORY_CODES;
}
