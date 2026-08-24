'use client'

// `LoadMoreFocusButton` 과 짝을 이루는 **건너뛰기 링크**(skip link) — 웹 표준 관행이다.
//
// 숨은 단추는 목록 **끝**에 있어서, 카드가 많은 목록에서는 Tab 을 수십~백 번 눌러야
// 닿는다 — 홈에서 실측하니 104번이었다(#1061). 그래서 목록 **앞**에 이 링크를 두고,
// 누르면 곧장 그 단추로 초점을 건너뛰게 한다.
//
// ⚠️ `href="#id"` 만으로는 브라우저마다 초점이 정말 그 요소로 가는지 보장이 안 된다.
//    그래서 onClick 에서 `document.getElementById(targetId)?.focus()` 를 직접 부른다.
//    href 는 지우지 않고 남겨 뒀다 — 자바스크립트가 안 돌아도 최소한 그 자리로는 간다.
//
// ⚠️ 초점이 옮겨 가면 브라우저가 화면도 그 자리로 같이 옮긴다(scrollIntoView).
//    이건 버그가 아니라 **의도한 동작**이다 — 반복되는 카드들을 건너뛰고 곧장
//    다음 페이지를 부르는 자리로 가는 것이 이 링크의 목적이다.
interface SkipToLoadMoreLinkProps {
  /** 건너뛸 곳 — 짝이 되는 `LoadMoreFocusButton` 의 `id` 와 같아야 한다. */
  targetId: string
  /** 다음 페이지가 없으면 링크도 안 그린다 — 갈 곳 없는 링크는 없느니만 못하다. */
  hasNextPage?: boolean
  /** 화면 낭독기가 읽을 말. 목록마다 「무엇을」 건너뛰는지 다르게 적는다. */
  label?: string
}

export default function SkipToLoadMoreLink({
  targetId,
  hasNextPage,
  label = '목록 건너뛰고 더 불러오기',
}: SkipToLoadMoreLinkProps) {
  if (!hasNextPage) return null

  return (
    <a
      href={`#${targetId}`}
      className="sr-only"
      onClick={(event) => {
        event.preventDefault()
        document.getElementById(targetId)?.focus()
      }}
    >
      {label}
    </a>
  )
}
