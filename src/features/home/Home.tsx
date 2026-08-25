'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { DetailFilter } from '@/features/home/components/filter/DetailFilter'
import { ProductsSection } from '@/features/home/components/product-section/ProductsSection'
import { fetchGraphQL } from '@/lib/api/graphql'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import LoadMoreFocusButton from '@/components/commons/LoadMoreFocusButton'
import SkipToLoadMoreLink from '@/components/commons/SkipToLoadMoreLink'
import SkipToSectionLink from '@/components/commons/SkipToSectionLink'
import { PRODUCT_TYPE_TABS, PET_TYPE_TABS, type ProductTypeTabId, SORT_TYPE, type PetTypeTabId } from '@/constants/constants'
import { PetTypeFilter } from './components/filter/PetTypeFilter'
import { CategoryFilter } from './components/filter/CategoryFilter'
import { MobileFilterSidebar, type DetailFilterValue } from './components/filter/MobileFilterSidebar'
import HomeHero from './components/HomeHero'
import HomeLoadingState from './components/HomeLoadingState'
import Link from 'next/link'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Plus } from 'lucide-react'
import Button from '@/components/commons/button/Button'
import { useUserStore } from '@/store/userStore'
import { PAGE_CONTAINER, Z_INDEX } from '@/constants/ui'
import HomeSkeleton from './components/product-section/HomeSkeleton'
import Spinner from '@/components/commons/spinner/Spinner'
import { productListQueryKey, extractProductSearchParams } from '@/lib/queries/productQueryKeys'
import { cn } from '@/lib/utils/cn'

function Home() {
  const { isLogin } = useUserStore()
  const hasHydrated = useUserStore((state) => state._hasHydrated)
  const isLoggedIn = hasHydrated && isLogin()
  const { searchParams, pathname, push } = useFilterNavigation()

  // 메인페이지 새로고침 시 스크롤 복원 비활성화 — hero가 헤더와 같은 톤이라 항상 처음부터 보여야 자연스러움
  useEffect(() => {
    if (typeof window === 'undefined') return
    const prev = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    return () => {
      window.history.scrollRestoration = prev
    }
  }, [])

  // URL에서 탭 초기값 결정 (시각적 표시용)
  const urlPetType = searchParams.get('petType')
  const urlProductType = searchParams.get('productType')
  const initialPetTab = (urlPetType && PET_TYPE_TABS.find((tab) => tab.code === urlPetType)?.id) || 'pet-tab-all'
  const initialProductTab = (urlProductType && PRODUCT_TYPE_TABS.find((tab) => tab.code === urlProductType)?.id) || 'tab-all'

  const [activePetTypeTab, setActivePetTypeTab] = useState<PetTypeTabId>(initialPetTab)
  const [activeProductTypeTab, setActiveProductTypeTab] = useState<ProductTypeTabId>(initialProductTab)

  const handlePetTypeTabChange = useCallback(
    (tabId: PetTypeTabId) => {
      setActivePetTypeTab(tabId)
      const petTypeCode = PET_TYPE_TABS.find((tab) => tab.id === tabId)?.code
      const params = new URLSearchParams(searchParams.toString())
      if (petTypeCode && petTypeCode !== 'ALL') {
        params.set('petType', petTypeCode)
      } else {
        params.delete('petType')
      }
      // 대분류 변경 시 소분류 초기화 (조류 + 토끼 같은 불가능한 조합 방지)
      params.delete('petDetailType')
      push(`${pathname}?${params.toString()}`)
    },
    [searchParams, push, pathname]
  )

  const handleProductTypeTabChange = useCallback(
    (tabId: string) => {
      setActiveProductTypeTab(tabId as ProductTypeTabId)
      const productTypeCode = PRODUCT_TYPE_TABS.find((tab) => tab.id === tabId)?.code
      const params = new URLSearchParams(searchParams.toString())
      if (productTypeCode && productTypeCode !== 'ALL') {
        params.set('productType', productTypeCode)
      } else {
        params.delete('productType')
      }
      push(`${pathname}?${params.toString()}`)
    },
    [searchParams, push, pathname]
  )

  // URL에서 필터 값 직접 파싱 (Single Source of Truth)
  const sortBy = searchParams.get('sortBy')
  const sortOrder = searchParams.get('sortOrder')
  const selectedDetailPet = searchParams.get('petDetailType') || null
  const selectedCategory = searchParams.get('categories') || null
  const selectedProductStatus = searchParams.get('productStatuses') || null
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const selectedProductPrice = minPrice ? { min: Number(minPrice), max: maxPrice ? Number(maxPrice) : null } : null

  const selectedSort = useMemo(() => {
    if (!sortBy) return '최신순'
    const sortItem = SORT_TYPE.find((sort) => {
      if (sortBy === 'price') {
        return sortOrder === 'asc' ? sort.id === 'orderedLowPriced' : sort.id === 'orderedHighPriced'
      }
      return sort.id === sortBy
    })
    return sortItem?.label ?? '최신순'
  }, [sortBy, sortOrder])

  const hasDetailFilter = searchParams.has('productStatuses') || searchParams.has('minPrice') || searchParams.has('addressSido')
  const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(false)

  // ⚠️ **넓은 화면에서는 늘 펼쳐 둔다.** 여는 단추가 `md:hidden` 으로 숨겨져 있어(#686)
  //    접힌 채로 두면 **열 방법이 아예 없다.** 예전에는 이 상태의 기본값이 `true` 라서
  //    단추 없이도 펼쳐져 있었는데, #1011 이 「기본 닫힘」으로 바꾸면서 그 짝이 깨졌다
  //    — 좁은 화면은 단추가 있어 괜찮았지만 넓은 화면만 막혔다(#1063).
  //
  // ⚠️ 기준을 **단추가 숨는 것과 같은 `md`(768)** 로 맞춘다. 저장소의 「데스크탑」 기준은
  //    1024 지만(#959), 여기서 1024 를 쓰면 **768~1023 구간이 그대로 막힌다** —
  //    그 폭에서는 단추도 없고 펼쳐지지도 않기 때문이다. 단추를 숨기는 기준을 바꾸면
  //    이 줄도 같이 바꿔야 한다.
  const 단추가없는폭이다 = useMediaQuery('(min-width: 768px)')
  const 세부필터를편다 = 단추가없는폭이다 || isDetailFilterOpen
  const [prevSearchParams, setPrevSearchParams] = useState(searchParams)

  if (searchParams !== prevSearchParams) {
    setPrevSearchParams(searchParams)
    if (hasDetailFilter) {
      setIsDetailFilterOpen(true)
    }
    // 뒤로가기/앞으로가기 시 탭 상태 동기화
    const newPetType = searchParams.get('petType')
    const newPetTab = (newPetType && PET_TYPE_TABS.find((tab) => tab.code === newPetType)?.id) || 'pet-tab-all'
    if (newPetTab !== activePetTypeTab) {
      setActivePetTypeTab(newPetTab)
    }
    const newProductType = searchParams.get('productType')
    const newProductTab = (newProductType && PRODUCT_TYPE_TABS.find((tab) => tab.code === newProductType)?.id) || 'tab-all'
    if (newProductTab !== activeProductTypeTab) {
      setActiveProductTypeTab(newProductTab)
    }
  }

  const handleDetailFilterToggle = useCallback((isOpen: boolean) => {
    setIsDetailFilterOpen(isOpen)
  }, [])

  // URL 파라미터 기반 쿼리 키 (서버 HydrationBoundary와 동일한 키)
  const filterParams = useMemo(() => extractProductSearchParams(searchParams), [searchParams])
  // ⚠️ **열쇠에 「누가 보는가」를 넣는다.** 까닭은 `productListQueryKey` 주석에 있다 —
  //    한 줄로 말하면 서버가 차단한 사람 상품을 빼 주는데 SSR 은 그걸 모른다.
  //    로그인이 확인되는 순간 열쇠가 `anon` → `me` 로 바뀌어 **반드시 다시 받는다.**
  const queryKey = useMemo(
    () => productListQueryKey(filterParams, isLoggedIn ? 'me' : 'anon'),
    [filterParams, isLoggedIn]
  )

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = useInfiniteQuery({
    queryKey,

    queryFn: async ({ pageParam = 0 }) => {
      const data = await fetchGraphQL<{ products: any }>(
        `
        query Products($page: Int!, $size: Int!, $productType: String, $productStatuses: String, $tradeStatuses: String, $minPrice: Int, $maxPrice: Int, $addressSido: String, $addressGugun: String, $categories: String, $petType: String, $petDetailType: String, $keyword: String, $sortBy: String, $sortOrder: String) {
          products(page: $page, size: $size, productType: $productType, productStatuses: $productStatuses, tradeStatuses: $tradeStatuses, minPrice: $minPrice, maxPrice: $maxPrice, addressSido: $addressSido, addressGugun: $addressGugun, categories: $categories, petType: $petType, petDetailType: $petDetailType, keyword: $keyword, sortBy: $sortBy, sortOrder: $sortOrder) {
            content { id title price mainImageUrl petDetailType productStatus productType tradeStatus createdAt viewCount favoriteCount isFavorite addressSido addressGugun }
            page totalPages totalElements hasNext
          }
        }
      `,
        {
          page: pageParam,
          size: 20,
          productType: filterParams.productType || undefined,
          productStatuses: filterParams.productStatuses || undefined,
          tradeStatuses: filterParams.tradeStatuses || undefined,
          minPrice: filterParams.minPrice ? Number(filterParams.minPrice) : undefined,
          maxPrice: filterParams.maxPrice ? Number(filterParams.maxPrice) : undefined,
          addressSido: filterParams.addressSido || undefined,
          addressGugun: filterParams.addressGugun || undefined,
          categories: filterParams.categories || undefined,
          petType: filterParams.petType || undefined,
          petDetailType: filterParams.petDetailType || undefined,
          keyword: filterParams.keyword || undefined,
          sortBy: filterParams.sortBy || undefined,
          sortOrder: filterParams.sortOrder || undefined,
        }
      )
      return data.products
    },

    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page
      const totalPages = lastPage.totalPages
      const hasNext = lastPage.hasNext

      if (hasNext && currentPage + 1 < totalPages) {
        return currentPage + 1
      }

      return undefined
    },

    initialPageParam: 0,

    staleTime: 60 * 1000,
  })

  const allProducts = data?.pages?.flatMap((page) => page.content) ?? []

  // 무한 스크롤 감지
  const targetRef = useIntersectionObserver({
    enabled: allProducts.length > 0,
    hasNextPage,
    isFetchingNextPage,
    onIntersect: fetchNextPage,
    threshold: 0.5,
  })

  // 좁은 화면의 세부 필터 서랍 — 검색 중에만 연다(아래 주석 참고).
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  /**
   * 서랍의 「적용」 — 상태·가격·지역 셋을 **한 번에** 주소에 싣는다.
   *
   * ⚠️ 하나씩 즉시 반영하지 않는 이유는 서랍 쪽 주석에 적었다(앱과 같은 방식).
   *    여기서는 **한 번만 push** 하는 것이 중요하다 — 셋을 따로 밀면 그 사이 목록이
   *    세 번 다시 그려진다.
   */
  const applyMobileFilter = useCallback(
    (next: DetailFilterValue) => {
      const params = new URLSearchParams(searchParams.toString())
      const set = (key: string, value: string | null) => (value ? params.set(key, value) : params.delete(key))
      set('productStatuses', next.productStatus)
      set('minPrice', next.price ? String(next.price.min) : null)
      set('maxPrice', next.price?.max != null ? String(next.price.max) : null)
      set('addressSido', next.sido)
      set('addressGugun', next.gugun)
      push(`${pathname}?${params.toString()}`)
      setIsMobileFilterOpen(false)
    },
    [searchParams, pathname, push]
  )

  const filterReset = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setActivePetTypeTab('pet-tab-all')
      setActiveProductTypeTab('tab-all')
      push(pathname)
    },
    [push, pathname]
  )

  const totalElements = data?.pages?.[0]?.totalElements || 0

  if (!hasHydrated) {
    return <HomeLoadingState />
  }

  /**
   * ⚠️ **검색 중에는 히어로를 안 그린다**(#961).
   *
   * 웹은 검색 결과 페이지가 따로 없고 **홈에 `?keyword=` 를 붙인 것**이라, 검색해도
   * 커다란 그림띠가 그대로 나와 **결과가 한 화면 아래로 밀렸다.** 찾을 게 정해져 있어
   * 들어온 사람에게 광고 그림을 먼저 보일 이유가 없다.
   *
   * 필터 묶음(#954)과 달리 **폭을 안 가린다** — 넓은 화면에서도 히어로는 한 화면을
   * 통째로 먹기 때문이다. 앱도 검색 결과에 비주얼 영역이 없다.
   */
  const 검색중이다 = Boolean(filterParams.keyword)

  if (error && !isLoading) {
    return (
      <>
        {검색중이다 ? null : <HomeHero />}
        <div className="flex min-h-100 items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <p>상품을 불러올 수 없습니다</p>
            <Button variant="link" onClick={() => refetch()} className="hover:text-primary text-primary-600 font-bold">
              다시 시도
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {검색중이다 ? null : <HomeHero />}
      <div className="bg-white">
        {/* ⚠️ **검색 중에는 위를 더 비운다.** 홈의 `main` 위 여백은 0이다 — 히어로가 헤더
            뒤까지 차오르기 때문인데, 검색 중에는 히어로를 안 그린다(#962). 그대로 두면
            **헤더(72px)가 상단 탭을 덮는다.** 헤더 높이 72 + 숨통 16 = 88(pt-22).
            md 부터는 원래 값(72)이 이미 헤더 높이와 같아 그대로 둔다. */}
        <div className={cn(PAGE_CONTAINER, 'pb-24 md:pt-18', 검색중이다 ? 'pt-22' : 'pt-12')}>
          <h1 className="sr-only">커들마켓</h1>
          {/* ⚠️ `relative` 는 아래 건너뛰기 링크를 띄울 **기준 자리**다. 지우지 말 것 —
              없으면 초점을 받은 링크가 페이지 맨 위로 날아간다. */}
          <div className="relative flex flex-col gap-6">
            {/* 필터를 건너뛰고 곧장 상품 목록으로 (#1072)
                키보드만 쓰는 사람이 목록에 닿기까지 Tab 을 65번 눌러야 했다 —
                품종 알약 41 · 카테고리 8 · 세부 필터 7 을 다 지나야 해서다.
                ⚠️ **이 줄은 필터보다 앞에 있어야 뜻이 있다.** 아래로 옮기지 말 것.
                ⚠️ 목록 안 카드를 건너뛰는 `SkipToLoadMoreLink`(아래)와 목적이 다르다. */}
            <SkipToSectionLink targetId="home-product-list" label="필터 건너뛰고 상품 목록 보기" />
            {/* Pet category & filters section */}
            {/* ⚠️ **검색 중이면 이 줄의 「모습」이 달라진다.**

                  제목(「우리 아이 맞춤 검색 / 어떤 아이와 함께하시나요?」)
                     검색 중에는 **어느 폭에서나 감춘다.** 그 문구는 **둘러보러 온 사람**에게
                     거는 말이라, 찾을 것을 정해 놓고 들어온 화면에서는 자리만 먹는다.

                  탭·소분류·카테고리
                     md(768) 부터 보인다. 그 아래는 감춘다 — 좁은 화면에서 이 줄이 첫 화면의
                     40%를 먹어 **결과가 한참 아래에서 시작하기** 때문이다(#954).

                ⚠️ **여기만 md(768)를 쓴다.** 이 저장소의 다른 곳은 「여기부터 데스크탑」을
                   lg(1024)로 묻는다(#959). 여기는 그 물음이 아니라 **「필터를 놓을 자리가
                   나오는가」**를 묻는 것이라 값이 다르다. 태블릿에서는 자리가 난다.

                ⚠️ **모바일 폭은 아직 정하지 않았다.** 앱의 검색 결과 화면과 견줘 보고 정한다.
                   지금은 예전 그대로 감춘다.

                ⚠️ 이 저장소는 검색 결과 페이지가 따로 없다 — 홈에 `?keyword=` 를 붙인
                   것이다(SearchBar.tsx). 그래서 여기서 갈라 준다. */}
            <div className={검색중이다 ? 'hidden md:block' : undefined}>
              <section aria-label="상품 필터" className="flex flex-col gap-3" data-nosnippet>
                {검색중이다 ? null : (
                  <div className="flex flex-col gap-1">
                    <h2 className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                      우리 아이 맞춤 검색
                      <span className="text-primary-600/70 text-xs font-normal">어떤 아이와 함께하시나요?</span>
                    </h2>
                  </div>
                )}
                <PetTypeFilter
                  activeTab={activePetTypeTab}
                  onTabChange={handlePetTypeTabChange}
                  selectedDetailPet={selectedDetailPet}
                />
                <CategoryFilter selectedCategory={selectedCategory} />
              </section>
            </div>

            {/* Detail filter section
                ⚠️ **검색 중 좁은 화면에서는 이 줄을 감추고 서랍으로 옮긴다.**
                   펼쳐진 채로 두면 높이가 329px 이라 결과가 한참 아래에서 시작한다(실측).
                   md 부터는 그대로 펼친다 — 자리가 나기 때문이다. */}
            <section aria-label="세부 필터" data-nosnippet className={검색중이다 ? 'hidden md:block' : undefined}>
              <DetailFilter
                isOpen={세부필터를편다}
                onToggle={handleDetailFilterToggle}
                selectedProductStatus={selectedProductStatus}
                selectedPriceRange={selectedProductPrice}
                filterReset={filterReset}
              />
            </section>

            {/* Product list section */}
            <SkipToLoadMoreLink targetId="home-products-load-more" hasNextPage={hasNextPage} />
            {/* ⚠️ `id` 와 `tabIndex={-1}` 은 위 건너뛰기 링크의 **목적지**다(#1072).
                `tabIndex={-1}` 이 없으면 `<section>` 은 초점을 못 받아 링크가 헛돈다.
                Tab 차례에는 안 낀다 — 프로그램으로 줄 때만 받는다.
                ⚠️ `scroll-mt-22`(88px)는 **고정 헤더(72px)에 목록 머리가 가리지 않게** 두는
                   빈칸이다. 72 + 숨통 16 = 88 — 위 `pt-22` 와 같은 셈법이다. */}
            <section
              aria-label="상품 목록"
              id="home-product-list"
              tabIndex={-1}
              className="flex flex-col gap-6 scroll-mt-22 pt-2 md:pt-0"
            >
              {/* <h2 className="heading-h4 text-gray-900">상품 목록</h2> */}
              {isLoading && allProducts.length === 0 ? (
                <HomeSkeleton />
              ) : (
                <ProductsSection
                  products={allProducts}
                  totalElements={totalElements}
                  activeTab={activeProductTypeTab}
                  selectedSort={selectedSort}
                  onTabChange={handleProductTypeTabChange}
                  // ⚠️ 서랍 단추는 **검색 중일 때만** 준다. 홈에서는 세부 필터가 펼쳐진 채로
                  //    있는 게 낫다 — 둘러보러 온 화면이라서다(#954 와 같은 논리).
                  onOpenMobileFilter={검색중이다 ? () => setIsMobileFilterOpen(true) : undefined}
                  hasDetailFilter={hasDetailFilter}
                  compactMobileToolbar={검색중이다}
                  keyword={filterParams.keyword}
                />
              )}
            </section>
          </div>
          {/* 무한 스크롤 감지용 요소 */}
          <div ref={targetRef} className="h-10" aria-hidden="true" />
          <LoadMoreFocusButton
            id="home-products-load-more"
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
            label="상품 더 불러오기"
          />

          {/* 세부 필터 서랍 — 좁은 화면에서 검색 중일 때만 쓴다.
              ⚠️ 늘 그려 두고 CSS 로 밀어 두는 것이 아니라 **검색 중일 때만 그린다.**
                 서랍은 화면 전체를 덮는 `fixed` 요소라, 안 쓸 때 DOM 에 남겨 두면
                 뒤 그늘이 눌림을 가로챌 위험이 있다. */}
          {검색중이다 ? (
            <MobileFilterSidebar
              isOpen={isMobileFilterOpen}
              onClose={() => setIsMobileFilterOpen(false)}
              value={{
                productStatus: selectedProductStatus,
                price: selectedProductPrice,
                sido: searchParams.get('addressSido'),
                gugun: searchParams.get('addressGugun'),
              }}
              onApply={applyMobileFilter}
              onReset={() => {
                const params = new URLSearchParams(searchParams.toString())
                ;['productStatuses', 'minPrice', 'maxPrice', 'addressSido', 'addressGugun'].forEach((key) =>
                  params.delete(key)
                )
                push(`${pathname}?${params.toString()}`)
              }}
            />
          ) : null}

          {isFetchingNextPage ? (
            <div className="flex items-center justify-center py-8" aria-live="polite">
              <Spinner size="md" label="상품 로딩 중" />
            </div>
          ) : null}
        </div>
      </div>

      {isLoggedIn ? (
        <Link
          href="/product-post"
          className={`bg-primary-600 fixed right-8 bottom-8 flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-lg transition-all hover:brightness-110 active:scale-95 max-md:right-4 max-md:bottom-20 md:px-6 md:py-4 ${Z_INDEX.FLOATING_BUTTON}`}
          aria-label="상품 등록"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span className="text-base font-bold">상품 등록</span>
        </Link>
      ) : null}
    </>
  )
}

export default Home
