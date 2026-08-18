'use client'

import { Search } from 'lucide-react'

const XL_BREAKPOINT = '(min-width: 1280px)'
const MOBILE_ACCORDION_OPEN_DELAY_MS = 320

function focusHeaderSearch() {
  const isXl = window.matchMedia(XL_BREAKPOINT).matches
  if (isXl) {
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
 * ⚠️ **다만 히어로만은 태블릿에 한 단계를 더 둔다**(#961). 다른 조각은 「모바일이냐
 *    데스크탑이냐」 둘 뿐이지만, 여기는 **그림과 글자가 자리를 나눠 갖는 곳**이라
 *    태블릿에서 세로로 쌓으면 그림이 아래에 홀로 떨어져 허전하다.
 *
 *      ~767    그림 아래 · 글자 위 (쌓임)
 *      768~    **수평** — 그림을 조금 줄이고(h-60) 45% 만 내준다. 글자는 한 단계만(2xl)
 *      1024~   그림에 52% · 글자 3xl
 *      1280~   그림에 40% · 글자 4xl
 *
 *    52% 를 태블릿에 그대로 쓰면 글자 칸이 378px 로 좁아져 **글자가 그림 위로 내려앉는다.**
 *    브라우저로 재서 맞춘 값이다.
 */
export default function HomeHero() {
  return (
    <section aria-label="히어로" className="bg-hero-surface relative h-100 w-full">
      <div className="relative mx-auto h-full xl:max-w-7xl xl:px-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="반려동물과 함께하는 따뜻한 마켓"
          src="/images/hero.webp"
          className="pointer-events-none absolute bottom-0 left-4 z-10 h-48 w-auto translate-y-[30%] md:h-60 md:translate-y-[29%] lg:h-90 lg:translate-y-[29.5%] xl:left-3.5"
        />
        <div className="text-primary absolute top-[15%] z-20 flex h-full w-full flex-col px-4 pt-8 md:justify-center md:pt-0 md:pl-[45%] lg:pl-[52%] xl:pl-[40%]">
          <h1 className="text-xl leading-tight font-bold md:text-2xl lg:text-3xl xl:text-4xl">
            우리 동네 반려인들과 함께하는
            <br />
            가장 따뜻한 중고 마켓
          </h1>
          <p className="mt-3 text-xs leading-relaxed md:text-sm lg:text-sm xl:text-base">
            내 주변 이웃과 함께하는 Cuddle Market에서
            <br />
            믿을 수 있는 중고 거래를 시작해보세요.
          </p>
          <button
            type="button"
            onClick={focusHeaderSearch}
            // hover 는 평소 색(#825500 = primary-600)보다 **한 단계 진해야** 눈에 띈다.
            // 전에는 hover 가 bg-primary 였는데, #847 이 주 단추를 primary-600 으로 모으면서
            // primary(#633F00)가 primary-700 과 같은 자리가 됐다. 이름만 바꾼 것이 아니라
            // 「평소보다 진하다」를 지키려고 700 을 적는다.
            // 이 단추는 Button 조각이 아니라 손으로 그린 것이라 공통값이 저절로 안 따라온다.
            // 그래서 높이 40·글자 14 를 손으로 적는다 — Button 의 md 와 같은 값이다.
            //
            // ⚠️ 높이를 h-10 으로 **못 박아야** 한다. padding(py-2)에 맡기면 글자 크기를 바꿀 때
            //    높이가 따라 흔들린다 — 실제로 글자를 16에서 14로 줄이자 40이 36이 됐다(#847).
            className="hover:bg-primary-700 mt-5 inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-full bg-[#825500] px-5 text-sm font-medium text-white shadow-sm transition-colors"
          >
            <Search className="h-4 w-4" />
            검색하러 가기
          </button>
        </div>
      </div>
    </section>
  )
}
