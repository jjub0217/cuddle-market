// 마크다운에서 기호를 걷어내 사람이 읽는 글만 남긴다.
//
// 어디에 쓰나: 검색 결과에 뜨는 메타 설명과 OG 이미지 미리보기.
// 커뮤니티 상세 응답에는 `contentPreview`가 없어서(목록 전용) 본문을 잘라 써야 하는데,
// 본문은 마크다운이라 그대로 자르면 `## 제목`·`**굵게**`·`![이미지](https://cdn/...)`가
// 검색 결과에 그대로 나온다.
//
// 화면에 그리는 마크다운은 `MdPreview`(react-markdown)가 맡는다. 이건 **글자만 필요한 곳**용이라
// 라이브러리를 쓰지 않는다 — 서버에서도 도는 코드라 가벼운 편이 낫다.

/** 이미지는 통째로 뺀다. 대체 문구를 남기면 「이미지」 같은 말만 줄줄이 남는다 */
const IMAGE = /!\[[^\]]*\]\([^)]*\)/g
/** 링크는 보이는 글자만 남긴다 — [커들마켓](https://…) → 커들마켓 */
const LINK = /\[([^\]]*)\]\([^)]*\)/g
/** 줄 맨 앞의 제목·인용·목록 기호 */
const LINE_PREFIX = /^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+|\d+\.\s+)/gm
/** 굵게·기울임·취소선·코드 표시 */
const EMPHASIS = /(\*\*|__|~~|\*|_|`)/g

/**
 * 마크다운을 한 줄짜리 평문으로.
 *
 * @param markdown 원문
 * @param maxLength 넘으면 잘라내고 `…`을 붙인다. 안 넘기면 안 자른다
 */
export function toPlainText(markdown: string | undefined | null, maxLength?: number): string {
  if (!markdown) return ''

  const plain = markdown
    .replace(IMAGE, ' ')
    .replace(LINK, '$1')
    .replace(LINE_PREFIX, '')
    .replace(EMPHASIS, '')
    // 줄바꿈을 공백으로 — 메타 설명은 한 줄이다
    .replace(/\s+/g, ' ')
    .trim()

  if (!maxLength || plain.length <= maxLength) return plain

  // 자른 자리가 말 중간이면 어색하다. 마지막 공백에서 끊는다
  const cut = plain.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}
