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

export default function HomeHero() {
  return (
    <section aria-label="히어로" className="bg-hero-surface relative h-100 w-full md:h-100">
      <div className="relative mx-auto h-full xl:max-w-7xl xl:px-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="반려동물과 함께하는 따뜻한 마켓"
          src="/images/hero.webp"
          className="pointer-events-none absolute bottom-0 left-4 z-10 h-48 w-auto translate-y-[30%] md:h-90 md:translate-y-[29.5%] xl:left-3.5"
        />
        <div className="text-primary absolute top-[15%] z-20 flex h-full w-full flex-col px-4 pt-8 md:justify-center md:pt-0 md:pl-[52%] xl:pl-[40%]">
          <h1 className="text-xl leading-tight font-bold md:text-3xl xl:text-4xl">
            우리 동네 반려인들과 함께하는
            <br />
            가장 따뜻한 중고 마켓
          </h1>
          <p className="mt-3 text-xs leading-relaxed md:text-sm xl:text-base">
            내 주변 이웃과 함께하는 Cuddle Market에서
            <br />
            믿을 수 있는 중고 거래를 시작해보세요.
          </p>
          <button
            type="button"
            onClick={focusHeaderSearch}
            className="hover:bg-primary mt-5 inline-flex w-fit cursor-pointer items-center gap-2 rounded-full bg-[#825500] px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors md:text-base"
          >
            <Search className="h-4 w-4" />
            검색하러 가기
          </button>
        </div>
      </div>
    </section>
  )
}
