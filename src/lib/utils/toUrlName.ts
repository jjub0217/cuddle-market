/**
 * 제목에서 URL용 문자열을 생성한다.
 * 예: "강아지 첫 용품 추천?" → "강아지첫용품추천"
 */
export function toUrlName(str: string): string {
  return (str ?? '')
    .replace(/[^\p{L}\p{N}]/gu, '') // 문자(한글/영문)와 숫자만 유지
    .toLowerCase()
}
