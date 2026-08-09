/**
 * ProductsSection 을 통째로 대신하는 스켈레톤.
 *
 * 두 자리에서 쓴다 — 하이드레이션 전(HomeLoadingState)과 상품을 불러오는 동안(Home.tsx).
 * 두 자리 모두 **ProductsSection 이 있어야 할 자리**라, 상품 격자뿐 아니라
 * 그 위의 탭·정렬 줄까지 함께 그려야 화면이 안 튄다.
 *
 * ⚠️ 헤더 줄과 카드는 **높이를 직접 못 박았다.** 안을 실제와 똑같이 짜서 높이를 맞추려면
 *    ProductCard 의 구조까지 베껴야 하는데, 그러면 카드가 바뀔 때마다 여기도 같이
 *    틀어진다. 회색 막대는 안이 정확할 필요가 없으니 **바깥 높이만** 맞춘다.
 *
 * 실측한 값 (#847):
 *   헤더 줄   폰 128 · 데스크탑 105
 *   카드      폰 127(가로형: 정보 왼쪽·사진 오른쪽) · 데스크탑 305(세로형: 사진 위)
 *   격자      gap-4 md:pt-5 · md:grid-cols-4 lg:grid-cols-5 · 첫 쪽 20개(Home.tsx 의 size)
 */
export default function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-2">
      {/* 탭(전체·판매·판매요청) + 「판매중」 토글 + 정렬 */}
      <div className="border-outline-variant flex h-[128px] flex-col justify-between gap-7 border-b pb-2 md:h-[105px] md:flex-row md:items-center md:gap-4 md:pt-15">
        <div className="flex flex-wrap items-center gap-2">
          {['w-16', 'w-20', 'w-24'].map((width, i) => (
            <div key={i} className={`h-8 ${width} animate-pulse rounded-full bg-gray-200 max-md:h-7`} />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-7 animate-pulse rounded-full bg-gray-200" />
            <div className="h-5 w-10 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="bg-outline-variant/60 hidden h-4 w-px md:block" />
          <div className="flex items-center gap-2">
            {['w-10', 'w-10', 'w-10', 'w-16'].map((width, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`h-5 ${width} animate-pulse rounded bg-gray-200`} />
                {i < 3 ? <span className="bg-outline-variant/60 h-3 w-px" /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 상품 격자 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:pt-5 lg:grid-cols-5">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="flex h-[127px] flex-row-reverse overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm md:h-[305px] md:flex-col-reverse md:rounded-3xl"
          >
            {/* 사진 — 폰은 오른쪽에 정사각, 데스크탑은 위에 4:3 */}
            <div className="w-[136px] shrink-0 animate-pulse bg-gray-200 md:aspect-[4/3] md:w-full" />
            <div className="flex flex-1 flex-col gap-2 p-3">
              <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
