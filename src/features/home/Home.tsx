'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { DetailFilter } from '@/features/home/components/filter/DetailFilter'
import { ProductsSection } from '@/features/home/components/product-section/ProductsSection'
import { fetchGraphQL } from '@/lib/api/graphql'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { PRODUCT_TYPE_TABS, PET_TYPE_TABS, type ProductTypeTabId, SORT_TYPE, type PetTypeTabId } from '@/constants/constants'
import { PetTypeFilter } from './components/filter/PetTypeFilter'
import { CategoryFilter } from './components/filter/CategoryFilter'
import HomeHero from './components/HomeHero'
import HomeLoadingState from './components/HomeLoadingState'
import Link from 'next/link'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import { Plus } from 'lucide-react'
import Button from '@/components/commons/button/Button'
import { useUserStore } from '@/store/userStore'
import { Z_INDEX } from '@/constants/ui'
import HomeSkeleton from './components/product-section/HomeSkeleton'
import Spinner from '@/components/commons/spinner/Spinner'
import { productListQueryKey, extractProductSearchParams } from '@/lib/queries/productQueryKeys'

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
  const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(true)
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
  const queryKey = useMemo(() => productListQueryKey(filterParams), [filterParams])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = useInfiniteQuery({
    queryKey,

    queryFn: async ({ pageParam = 0 }) => {
      const data = await fetchGraphQL<{ products: any }>(
        `
        query Products($page: Int!, $size: Int!, $productType: String, $productStatuses: String, $minPrice: Int, $maxPrice: Int, $addressSido: String, $addressGugun: String, $categories: String, $petType: String, $petDetailType: String, $keyword: String, $sortBy: String, $sortOrder: String) {
          products(page: $page, size: $size, productType: $productType, productStatuses: $productStatuses, minPrice: $minPrice, maxPrice: $maxPrice, addressSido: $addressSido, addressGugun: $addressGugun, categories: $categories, petType: $petType, petDetailType: $petDetailType, keyword: $keyword, sortBy: $sortBy, sortOrder: $sortOrder) {
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

  if (error && !isLoading) {
    return (
      <>
        <HomeHero />
        <div className="flex min-h-100 items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <p>상품을 불러올 수 없습니다</p>
            <Button variant="link" onClick={() => refetch()} className="hover:text-primary font-bold text-[#825500]">
              다시 시도
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <HomeHero />
      <div className="bg-white">
        <div className="mx-auto max-w-[1280px] px-4 pt-12 pb-24 md:px-8 md:pt-18">
          <h1 className="sr-only">커들마켓</h1>
          <div className="flex flex-col gap-6">
            {/* Pet category & filters section */}
            <section aria-label="상품 필터" className="flex flex-col gap-3" data-nosnippet>
              <div className="flex flex-col gap-1">
                <h2 className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-900">
                  우리 아이 맞춤 검색
                  <span className="text-xs font-normal text-[#825500]/70">어떤 아이와 함께하시나요?</span>
                </h2>
              </div>
              <PetTypeFilter
                activeTab={activePetTypeTab}
                onTabChange={handlePetTypeTabChange}
                selectedDetailPet={selectedDetailPet}
              />
              <CategoryFilter selectedCategory={selectedCategory} />
            </section>

            {/* Detail filter section */}
            <section aria-label="세부 필터" data-nosnippet>
              <DetailFilter
                isOpen={isDetailFilterOpen}
                onToggle={handleDetailFilterToggle}
                selectedProductStatus={selectedProductStatus}
                selectedPriceRange={selectedProductPrice}
                filterReset={filterReset}
              />
            </section>

            {/* Product list section */}
            <section aria-label="상품 목록" className="flex flex-col gap-6 pt-2 md:pt-0">
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
                />
              )}
            </section>
          </div>
          {/* 무한 스크롤 감지용 요소 */}
          <div ref={targetRef} className="h-10" aria-hidden="true" />

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
          className={`fixed right-8 bottom-8 flex items-center gap-2 rounded-full bg-[#825500] px-4 py-3 text-white shadow-lg transition-all hover:brightness-110 active:scale-95 max-md:right-4 max-md:bottom-20 md:px-6 md:py-4 ${Z_INDEX.FLOATING_BUTTON}`}
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
