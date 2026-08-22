'use client'

import { Search } from 'lucide-react'

// ⚠️ **Header.tsx 와 같은 값이어야 한다**(#961). 헤더가 이 폭부터 데스크탑 검색칸을 그린다.
//    여기만 1280 으로 남으면 1024~1280 에서 **검색칸이 화면에 있는데 모바일 검색창이 열려**
//    아무 일도 안 일어난 것처럼 보인다(모바일 검색창은 lg:hidden 이다).
const DESKTOP_BREAKPOINT = '(min-width: 1024px)'
const MOBILE_ACCORDION_OPEN_DELAY_MS = 320

function focusHeaderSearch() {
  const isDesktop = window.matchMedia(DESKTOP_BREAKPOINT).matches
  if (isDesktop) {
    document.getElementById('search-desktop')?.focus()
    return
  }
  window.dispatchEvent(new CustomEvent('cuddle:open-search'))
  window.setTimeout(() => {
    document.getElementById('search-mobile')?.focus()
  }, MOBILE_ACCORDION_OPEN_DELAY_MS)
}

/**
 * ⚠️ **「여기부터 데스크탑」 기준은 lg(1024)다**(#961). 예전에는 md(768)였는데,
 *    768~1279 에서 **글자 칸이 오른쪽 48%(`md:pl-[52%]`) 뿐인데 글자는 커져서**
 *    (`md:text-3xl`) 「우리 동네 반려인들과 함께하는」이 한 글자 넘치고, 넘친 줄이
 *    **강아지 그림 위로 내려앉았다**(아이패드 세로 820px 에서 확인).
 *
 *    #959 에서 다른 다섯 곳을 lg 로 맞출 때 여기만 빠져 있었다 —
 *    「여기부터 데스크탑」을 묻는 곳은 **다 같은 값**을 써야 한다.
 *
 * **규칙은 하나다 — 글자는 「그림 오른쪽 + 38px」에 놓는다.** 640 부터 2560 까지 같다.
 *    그림은 높이로 크기가 정해져 **폭이 안 변하니**(h-48 이면 늘 253px) 띄우는 값도
 *    폭에 안 딸린 **고정 px** 여야 한다. % 로 두면 폭 따라 간격이 널뛴다 —
 *    실제로 45% 로 두었을 때 768 에서 14px, 1023 에서 128px 이었다.
 *
 *      ~639     쌓임 — 글자가 위, 그림이 아래 왼쪽. 나란히 놓을 자리가 안 나온다
 *      640~767  수평 — 띠 288 · 그림 h-48(253×192) · 글자 307 부터 · 글자 xl
 *      768~1023 수평 — 띠 304 · 그림 h-60(316×240) · 글자 370 부터 · 글자 2xl
 *      1024~    수평 — 띠 400 · 그림 h-90(474×360) · 글자 512+14=526 부터 · 글자 3xl(30px)
 *                     **여기부터는 더 안 커진다** (2560 까지 같다)
 *
 *    ⚠️ **띠 높이도 그림에 맞춰 줄인다.** 띠를 400 으로 고정해 두면 그림만 작아져서
 *    **위가 텅 빈다** — 721px 에서 208px 이 비었다. 그래서 640~767 은 288,
 *    768~1023 은 304 로 낮췄다. 눈으로 견줘서 고른 값이다.
 *
 *    ⚠️ **띠 높이와 `top-%` 는 같이 움직여야 한다.** 글자 칸이 띠 높이의 몇 %에서
 *    시작하므로, **띠를 키우면 글자도 같이 내려간다** — 띠를 32 키워도 단추 아래는
 *    11 밖에 안 는다. 그래서 640~1023 은 `top` 을 15%→10% 로 함께 올렸다.
 *
 *    ⚠️ **글자를 더 올리면 헤더 뒤로 들어간다.** 홈에서는 헤더가 히어로 위에 투명하게
 *    떠 있고 아래끝이 72px 이다. 지금은 h1 위끝이 87~94 라 15~22px 이 남는다.
 *
 *    ⚠️ **1024 위에 1280 단계를 따로 두지 않는다**(#961). 예전에는 1024~1279 만 그림이
 *    h-72 로 작았는데, 「1024 이상은 한 얼굴」이라고 정해 놓고 **1261px 과 1282px 이
 *    다르게 보였다.**
 *
 *      1024 에서 잰 값 —  그림 16..490 · 글자 528 부터 · 남는 칸 480px
 *                        h1 의 제일 긴 줄이 30px 일 때 357px 이라 줄바꿈 없이 들어간다
 */
export default function HomeHero() {
  return (
    // 띠 높이는 그림 높이를 따라간다 — 그림보다 훨씬 높으면 위가 빈다(위 주석).
    <section aria-label="히어로" className="bg-hero-surface relative h-100 w-full sm:h-72 md:h-76 lg:h-100">
      <div className="relative mx-auto h-full lg:max-w-7xl lg:px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="반려동물과 함께하는 따뜻한 마켓"
          src="/images/hero.webp"
          className="pointer-events-none absolute bottom-0 left-4 z-10 h-48 w-auto translate-y-[30%] md:h-60 md:translate-y-[29%] lg:h-90 lg:translate-y-[29.5%]"
        />
        {/* 띄우는 값 = 그림 왼쪽 + 그림 폭 + 38.
              640~   16 + 253 + 38 = 307
              768~   16 + 316 + 38 = 370
              1024~  16 + 474 + 38 = 528 → 이 칸이 여백 안쪽 16 에서 시작하므로 512 를 적는다

            ⚠️ **폭에서 컨테이너 여백(lg:px-4 좌우 16+16=32)을 빼야 한다.** 이 칸은 `left` 를
               안 줘서 **여백 안쪽 14px 에서 시작**하는데, `w-full` 은 여백을 모르고 컨테이너
               폭을 통째로 받는다. 그러면 오른쪽으로 14px 삐져나가 **1024~1280 에서 페이지가
               가로로 밀린다**(실측 scrollWidth 1038 vs 1024). 글자는 왼쪽 정렬이라 칸이
               28px 좁아져도 보이는 변화는 없다. */}
        <div className="text-primary absolute top-[15%] z-20 flex h-full w-full flex-col px-4 pt-8 sm:top-[10%] sm:justify-center sm:pt-0 sm:pl-[307px] md:pl-[370px] lg:top-[15%] lg:w-[calc(100%-2rem)] lg:pl-[512px]">
          <h1 className="text-xl leading-tight font-bold md:text-2xl lg:text-3xl">
            우리 동네 반려인들과 함께하는
            <br />
            가장 따뜻한 중고 마켓
          </h1>
          <p className="mt-3 text-xs leading-relaxed md:text-sm lg:text-base">
            내 주변 이웃과 함께하는 Cuddle Market에서
            <br />
            믿을 수 있는 중고 거래를 시작해보세요.
          </p>
          <button
            type="button"
            onClick={focusHeaderSearch}
            // hover 는 평소 색(primary-600)보다 **한 단계 진해야** 눈에 띈다.
            // 전에는 hover 가 bg-primary 였는데, #847 이 주 단추를 primary-600 으로 모으면서
            // primary(#633F00)가 primary-700 과 같은 자리가 됐다. 이름만 바꾼 것이 아니라
            // 「평소보다 진하다」를 지키려고 700 을 적는다.
            // 이 단추는 Button 조각이 아니라 손으로 그린 것이라 공통값이 저절로 안 따라온다.
            // 그래서 높이 40·글자 14 를 손으로 적는다 — Button 의 md 와 같은 값이다.
            //
            // ⚠️ 높이를 h-10 으로 **못 박아야** 한다. padding(py-2)에 맡기면 글자 크기를 바꿀 때
            //    높이가 따라 흔들린다 — 실제로 글자를 16에서 14로 줄이자 40이 36이 됐다(#847).
            className="bg-primary-600 hover:bg-primary-700 mt-5 inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-full px-5 text-sm font-medium text-white shadow-sm transition-colors"
          >
            <Search className="h-4 w-4" />
            검색하러 가기
          </button>
        </div>
      </div>
    </section>
  )
}
