'use client'

// 감시 깃발(sentinel) 옆에 두는 **화면엔 안 보이지만 Tab 으로는 걸리는 단추**.
//
// 무한 목록은 스크롤(마우스·터치)로 깃발이 화면에 들어와야 다음 페이지를 부른다.
// 그런데 키보드만 쓰는 사람은 스크롤을 낼 방법이 없어 다음 페이지로 영영 못 갔다(#1061).
// 이 단추가 그 대신 다음 페이지를 부르는 통로가 된다.
//
// ⚠️ `display: none`·`visibility: hidden` 을 쓰면 Tab 으로 안 걸린다. Tailwind 의
//    `sr-only`(화면엔 안 보이되 자리·초점은 그대로 남기는 내장 유틸)를 쓴다 —
//    이 저장소에 이미 여러 화면(UserPage, Home, SignUpForm 등)이 쓰고 있어 새로 안 만들었다.
//    시각 초점 표시(focus-visible 로 보이게 하는 것)는 이번에 고르지 않았다 — 그건
//    「더보기」 단추를 되살리는 다른 갈래였고, #1046 이 일부러 없앤 것을 다시 보이는
//    형태로 되돌리는 셈이라 제외했다.
//
// ⚠️ 감시 깃발 `<div>` 에는 보통 `aria-hidden="true"` 가 붙는다. 이 단추는 그 안이 아니라
//    **형제 자리**에 둬라 — 안에 넣으면 화면 낭독기가 이 단추를 못 읽는다.
//
// ⚠️ **카드가 많은 목록에서는 이 단추까지 Tab 이 수십~백 번 걸린다** — 홈에서 실측하니
//    104번이었다(#1061 사용자 실측). 그래서 목록 **앞**에 짝이 되는 `SkipToLoadMoreLink`
//    를 두고 곧장 이 단추로 초점을 건너뛰게 한다. 그 링크가 찾아올 수 있도록 `id` 를
//    반드시 받는다 — 자리마다 겹치지 않는 값을 준다.
interface LoadMoreFocusButtonProps {
  /** 이 단추의 id. `SkipToLoadMoreLink` 가 `#id` 로 건너뛴다. 자리마다 겹치지 않게 준다. */
  id: string
  /** 다음 페이지가 남았는가. 없으면 단추 자체를 그리지 않는다. */
  hasNextPage?: boolean
  /** 지금 다음 페이지를 받는 중인가 — 받는 동안은 눌러도 또 부르지 않는다. */
  isFetchingNextPage: boolean
  /** 눌렸을 때 부를 것 — 보통 `fetchNextPage`. */
  onLoadMore: () => void
  /** 화면 낭독기가 읽을 말. 목록마다 「무엇을」 더 부르는지 다르게 적는다. */
  label?: string
}

export default function LoadMoreFocusButton({
  id,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  label = '다음 페이지 불러오기',
}: LoadMoreFocusButtonProps) {
  if (!hasNextPage) return null

  return (
    // ⚠️ **`disabled` 를 쓰면 안 된다.** 이 단추로 초점이 가면 화면이 그 자리로 따라가고,
    //    그러면 감시 깃발이 보여 다음 페이지를 부르기 시작한다 → `isFetchingNextPage` 가
    //    true 가 되고 → `disabled` 가 붙는 순간 **브라우저가 초점을 강제로 뗀다.**
    //    2026-08-24 에 크롬으로 쟀다 — 엔터 직후엔 단추에 초점이 갔다가 **60ms 만에
    //    body 로 튕겼고**, 520ms 뒤 disabled 가 풀려도 초점은 안 돌아왔다.
    //    그래서 건너뛰기 링크를 눌러도 아무 일이 없었다.
    //    `aria-disabled` 는 낭독기에 「지금은 못 누른다」를 알리면서 초점은 지킨다.
    <button
      id={id}
      type="button"
      onClick={() => {
        if (!isFetchingNextPage) onLoadMore()
      }}
      aria-disabled={isFetchingNextPage}
      className="sr-only"
    >
      {label}
    </button>
  )
}
