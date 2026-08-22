import HomeSkeleton from './product-section/HomeSkeleton'
import HomeHero from './HomeHero'
import { PAGE_CONTAINER } from '@/constants/ui'
import { cn } from '@/lib/utils/cn'

/**
 * Home 이 하이드레이션을 기다리는 동안 보여주는 스켈레톤.
 *
 * ⚠️ **크기·간격을 `Home.tsx` 와 같은 값으로 유지해야 한다.** 다르면 하이드레이션이
 *    끝나는 순간 화면이 덜컥 움직인다.
 *
 * 2026-08-09 에 실제로 어긋나 있었다. 이 파일은 #686(메인 리뉴얼)에 만든 뒤 그대로인데
 * 실제 홈만 #752·#754 에서 바뀌어서, 섹션 간격이 40 대 24, 소분류 칩이 40 대 26 이었다.
 * **실제 화면을 고칠 때 이 파일도 같이 보라.**
 *
 * 실측으로 맞춘 값 (데스크탑 1440 · #847):
 *   상품 필터 섹션 310 = 헤딩 20 + PetTypeFilter 150 + CategoryFilter 116 (사이 간격 12 둘)
 *   PetTypeFilter  150 = 탭바 46 + 칩 줄 90 (사이 14)
 *   CategoryFilter 116 = 위 여백 8 + 스크롤 줄 108 (단추 100 + 아래 여백 8)
 *   세부 필터 카드 110 = 위아래 여백 40 + 열 64 + 테두리 2
 */

/** 소분류 칩의 폭. 실제 이름 길이가 제각각이라 섞어야 줄 수가 비슷해진다(데스크탑에서 3줄). */
const CHIP_WIDTHS = [
  'w-12', 'w-14', 'w-14', 'w-12', 'w-16', 'w-16', 'w-12', 'w-14', 'w-16', 'w-12',
  'w-14', 'w-16', 'w-16', 'w-14', 'w-11', 'w-14', 'w-12', 'w-14', 'w-14', 'w-16',
  'w-14', 'w-12', 'w-14', 'w-12', 'w-16', 'w-11', 'w-11', 'w-14', 'w-12', 'w-12',
  'w-14', 'w-11', 'w-16', 'w-14', 'w-16', 'w-12', 'w-14', 'w-16', 'w-20',
]

export default function HomeLoadingState() {
  return (
    <>
      <HomeHero />
      <div className="bg-white">
        <div className={cn(PAGE_CONTAINER, 'pt-12 pb-24 md:pt-18')}>
          <h1 className="sr-only">커들마켓</h1>
          <div className="flex flex-col gap-6">
            {/* 상품 필터 — 헤딩 + PetTypeFilter + CategoryFilter */}
            <section aria-hidden="true" className="flex flex-col gap-3">
              {/* 이 헤딩은 진짜 글자다. 회색 막대로 두면 글자가 나타날 때 한 번 더 바뀐다 */}
              <div className="flex flex-col gap-1">
                <h2 className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                  우리 아이 맞춤 검색
                  <span className="text-primary-600/70 text-xs font-normal">어떤 아이와 함께하시나요?</span>
                </h2>
              </div>

              {/* PetTypeFilter — 대분류 탭바(46) + 소분류 칩 줄 */}
              <div className="flex flex-col gap-3.5">
                {/* 탭 하나가 pt-3 + 글자 20 + pb-* + 아래 테두리다. 폰은 pb-1 이라 38 이다 */}
                <div className="border-outline-variant flex h-[38px] items-center gap-3 overflow-hidden border-b md:h-[46px]">
                  {[...Array(11)].map((_, i) => (
                    <div key={i} className="h-5 w-12 shrink-0 animate-pulse rounded bg-gray-200" />
                  ))}
                </div>
                {/* 줄 수는 칩 개수·이름 길이에 달렸는데 그건 반려동물 데이터가 정한다.
                    폭을 맞춰 줄 수를 맞추는 건 부질없으니 **바깥 높이를 못 박는다**
                    (폰 4줄 122 · 데스크탑 3줄 90 — 2026-08-09 실측). */}
                <div className="flex h-[122px] flex-wrap gap-1.5 overflow-hidden md:h-[90px]">
                  {CHIP_WIDTHS.map((width, i) => (
                    <div key={i} className={`h-[26px] ${width} animate-pulse rounded-full bg-gray-200`} />
                  ))}
                </div>
              </div>

              {/* CategoryFilter — 아이콘 가로 줄 */}
              <div className="flex flex-col gap-4 pt-3 md:pt-2">
                <div className="-mx-2 flex items-start gap-3 overflow-hidden px-2 pb-2 md:gap-5">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex shrink-0 flex-col items-center gap-1 md:min-w-20 md:gap-0">
                      <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200 md:h-20 md:w-20" />
                      <div className="h-4 w-10 animate-pulse rounded bg-gray-200 md:h-5" />
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 세부 필터 — 흰 카드 안에 세 열(상품 상태 · 가격대 · 지역) */}
            <section aria-hidden="true">
              <div className="max-md:border-outline-variant flex flex-col gap-3 max-md:rounded-3xl max-md:border max-md:bg-white max-md:px-4 max-md:py-3 max-md:shadow-sm">
                {/* 폰에만 있는 「상세 필터」 접기 줄 (DetailFilter 의 md:hidden 머리) */}
                <div className="flex h-9 items-center justify-between md:hidden">
                  <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
                </div>
                {/* 세 열의 높이는 칩이 몇 줄로 접히느냐에 달렸다. 칩 줄과 같은 이유로 높이를 못 박는다
                    (폰 255 · 데스크탑 68 — 2026-08-09 실측) */}
                <div className="h-[255px] overflow-hidden md:h-[68px] md:border-outline-variant md:box-content md:rounded-3xl md:border md:bg-white md:px-6 md:py-5 md:shadow-sm">
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-10">
                    {[...Array(3)].map((_, columnIndex) => (
                      <div key={columnIndex} className="flex flex-col gap-2 max-md:gap-0">
                        <div className="mb-1 h-5 w-14 animate-pulse rounded bg-gray-200" />
                        <div className="flex flex-wrap gap-2">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-9 w-[76px] animate-pulse rounded-lg bg-gray-200" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 상품 목록 — 탭·정렬 줄과 그리드는 HomeSkeleton 이 통째로 맡는다.
                실제 화면에서도 이 자리에 ProductsSection 하나가 들어간다 */}
            <section aria-hidden="true" className="flex flex-col gap-6 pt-2 md:pt-0">
              <HomeSkeleton />
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
