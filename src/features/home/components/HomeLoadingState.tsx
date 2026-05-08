import HomeSkeleton from './product-section/HomeSkeleton'
import HomeHero from './HomeHero'

/**
 * Home 컴포넌트가 클라이언트 하이드레이션 대기 중일 때 보여주는 스켈레톤.
 * 실제 레이아웃의 섹션 구조와 1:1 매칭되도록 구성:
 *   1. PetTypeFilter (탭바 + 칩)
 *   2. CategoryFilter (아이콘 그리드)
 *   3. DetailFilter (흰 카드 + 3섹션)
 *   4. ProductsSection (탭 + 정렬 + 상품 그리드)
 */
export default function HomeLoadingState() {
  return (
    <>
      <HomeHero />
      <div className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 pt-12 pb-24 md:px-8 md:pt-16">
          <h1 className="sr-only">커들마켓</h1>
          <div className="flex flex-col gap-10">
            {/* "우리 아이 맞춤 검색" 영역 (헤딩 + PetTypeFilter + CategoryFilter) */}
            <section className="flex flex-col gap-6">
              <h2 className="text-md flex flex-wrap items-center gap-2 text-gray-900">
                우리 아이 맞춤 검색
                <span className="text-sm font-normal text-[#825500]/70 md:text-base">어떤 아이와 함께하시나요?</span>
              </h2>

              {/* PetTypeFilter: 탭바 + 칩 */}
              <div className="flex flex-col gap-5">
                <div className="flex gap-6 overflow-hidden border-b border-[#d4c4b2] pb-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-7 w-16 shrink-0 animate-pulse rounded bg-gray-200" />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-10 w-20 animate-pulse rounded-full bg-gray-200" />
                  ))}
                </div>
              </div>

              {/* CategoryFilter: 아이콘 그리드 */}
              <div className="flex items-start gap-4 overflow-hidden md:gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="flex min-w-18 shrink-0 flex-col items-center gap-2">
                    <div className="h-16 w-16 animate-pulse rounded-2xl bg-gray-200 md:h-18 md:w-18" />
                    <div className="h-3 w-12 animate-pulse rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </section>

            {/* DetailFilter: 흰 카드 + 3섹션 (상품 상태 / 가격대 / 지역) */}
            <section
              aria-hidden="true"
              className="rounded-3xl border border-[#d4c4b2] bg-white px-6 py-6 shadow-sm md:px-10 md:py-8"
            >
              <div className="flex flex-col gap-8 md:flex-row md:gap-10">
                {[...Array(3)].map((_, sectionIdx) => (
                  <div key={sectionIdx} className="flex flex-1 flex-col gap-3">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                    <div className="flex flex-wrap gap-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-9 w-20 animate-pulse rounded-lg bg-gray-200" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ProductsSection: 헤딩 + 탭/정렬 + 상품 그리드 */}
            <section className="flex flex-col gap-6">
              <h2 className="heading-h3 text-gray-900">상품 목록</h2>
              <div className="flex flex-col justify-between gap-4 border-b border-[#d4c4b2] pb-5 md:flex-row md:items-center">
                <div className="flex items-center gap-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 w-24 animate-pulse rounded-full bg-gray-200" />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 w-12 animate-pulse rounded bg-gray-200" />
                  ))}
                </div>
              </div>
              <HomeSkeleton />
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
