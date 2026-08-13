import { toUrlName } from './toUrlName'

/**
 * 상세 페이지 주소를 만든다. 이름 자리는 아스키 글자만 들어가게 감싼다.
 *
 * 왜 감싸나 — 서버에서 이 주소로 넘길 때(`redirect`) 값이 응답 헤더(Location)에 실린다.
 * Node 는 헤더 값에 아스키 밖 글자를 못 넣어서, 한글 제목이면 그대로 500 이 난다.
 *   '/community/39/마크다운테스트'                       → Invalid character in header content
 *   '/community/39/' + encodeURIComponent('마크다운테스트') → '/community/39/%EB%A7%88...'
 *
 * 받는 쪽([id]/[name] 페이지)은 주소 조각을 다시 풀어 보므로 이름 비교는 그대로 맞는다.
 */
function detailPath(base: string, id: string | number, title: string): string {
  return `/${base}/${id}/${encodeURIComponent(toUrlName(title))}`
}

/** 예: (74, '강아지 사료 팝니다') → '/products/74/%EA%B0%95%EC%95%84%EC%A7%80...' */
export function productDetailPath(id: string | number, title: string): string {
  return detailPath('products', id, title)
}

/** 예: (39, '마크다운 테스트') → '/community/39/%EB%A7%88%ED%81%AC%EB%8B%A4...' */
export function communityDetailPath(id: string | number, title: string): string {
  return detailPath('community', id, title)
}
