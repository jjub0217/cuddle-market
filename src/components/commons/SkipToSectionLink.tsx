'use client'

// 화면 앞쪽에 **매번 거쳐야 하는 덩어리**가 있을 때, 그것을 건너뛰고 곧장 본론으로
// 보내는 **건너뛰기 링크**(skip link) — 웹 표준 관행이다.
//
// 홈이 그 경우다. 키보드만 쓰는 사람이 상품 목록에 닿기까지 Tab 을 **65번** 눌러야 했다
// (#1072 실측). 품종 알약 41 · 카테고리 8 · 세부 필터 7 을 하나하나 지나야 해서다.
//
// ⚠️ **짝처럼 보이는 `SkipToLoadMoreLink` 와 목적이 다르다.** 헷갈리지 말 것.
//
//      SkipToLoadMoreLink   목록 **안**의 반복되는 카드를 건너뛰어 「더 불러오기」로 간다
//      SkipToSectionLink    목록 **앞**의 필터 덩어리를 건너뛰어 목록 **시작**으로 간다
//
//    그래서 이 링크는 `hasNextPage` 를 안 본다 — 다음 페이지가 없어도 목록은 있다.
//
// ⚠️ `href="#id"` 만으로는 브라우저마다 초점이 정말 그 요소로 가는지 보장이 안 된다.
//    그래서 onClick 에서 `document.getElementById(targetId)?.focus()` 를 직접 부른다.
//    href 는 지우지 않고 남겨 뒀다 — 자바스크립트가 안 돌아도 최소한 그 자리로는 간다.
//
// ⚠️ **목적지에 `tabIndex={-1}` 이 있어야 초점이 간다.** `<section>` 같은 평범한 요소는
//    기본으로 초점을 못 받는다. `tabIndex={-1}` 은 「Tab 차례에는 안 끼지만 프로그램으로는
//    초점을 줄 수 있다」는 뜻이라 건너뛰기 목적지에 딱 맞는다.
//
// ⚠️ **초점을 받으면 화면에 보인다.** 지금 어디에 있는지 안 보이면 눈이 보이는 키보드
//    사용자가 길을 잃는다 — #1062 가 고친 것과 같은 문제다. 평소에는 `sr-only` 로 숨는다.
//
// ⚠️ **테두리는 여기서 안 그린다.** `globals.css` 의 전역 초점 규칙
//    (`:focus-visible:not(.focus-ring-custom)`)이 1.2px 테두리를 대신 그려 준다.
//    여기서 또 그리면 두 겹이 되거나 두께가 다른 자리와 어긋난다(#1062).
//
// ⚠️ **부모에 `relative` 가 있어야 한다.** 초점을 받았을 때 `absolute` 로 띄워서
//    뒤 내용을 밀지 않게 하는데, 기준이 될 자리가 없으면 페이지 맨 위로 날아간다.
interface SkipToSectionLinkProps {
  /** 건너뛸 곳 — 목적지 요소의 `id` 와 같아야 한다. 그 요소에는 `tabIndex={-1}` 이 필요하다. */
  targetId: string
  /** 화면 낭독기가 읽고, 초점을 받으면 화면에도 보이는 말. 무엇을 건너뛰는지 적는다. */
  label: string
}

export default function SkipToSectionLink({ targetId, label }: SkipToSectionLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-10 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-600 focus:shadow-md"
      onClick={(event) => {
        event.preventDefault()
        const 목적지 = document.getElementById(targetId)
        if (!목적지) return
        // ⚠️ **초점이 저절로 옮기는 화면을 그대로 두면 안 된다.** 크롬은 초점을 줄 때
        //    그 요소를 화면 **가운데**에 맞춘다 — 목록이 화면보다 길면 시작점이 위로
        //    잘려 나간다. 2026-08-25 에 홈에서 쟀더니 목록 시작이 **274px 위**로
        //    사라져 도구줄(탭·정렬)이 안 보였다(목록 1448px vs 화면 900px).
        //    그래서 초점의 스크롤은 끄고(preventScroll) 우리가 「시작」에 맞춘다.
        //    ⚠️ 고정 헤더에 가리지 않게 목적지에 `scroll-mt-*` 를 준다.
        목적지.focus({ preventScroll: true })
        목적지.scrollIntoView({ block: 'start' })
      }}
    >
      {label}
    </a>
  )
}
