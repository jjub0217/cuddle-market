// 검색어를 다듬는다. 화면(app/search.tsx)이 이 함수로 「넘어가도 되는 검색어인지」를 정한다.

/**
 * 넘어가도 되는 검색어인지 판단한다.
 *
 * 앞뒤 공백을 떼고, 그래도 남는 게 없으면(빈 문자열·공백만) null이다.
 * 공백만 있는 검색어를 그대로 보내면 결과 화면이 사실상 홈(전체 목록)과 같아져서
 * 「검색했다」는 느낌 없이 헷갈린다 — 그래서 아예 넘어가지 못하게 막는다.
 */
export function normalizeKeyword(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
