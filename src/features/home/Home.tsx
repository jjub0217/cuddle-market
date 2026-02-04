'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import { Tabs } from '@/components/Tabs'
import { DetailFilter } from '@/features/home/components/filter/DetailFilter'
import { ProductsSection } from '@/features/home/components/product-section/ProductsSection'
import { fetchAllProducts } from '@/lib/api/products'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { PRODUCT_TYPE_TABS, PET_TYPE_TABS, type ProductTypeTabId, SORT_TYPE, type SORT_LABELS } from '@/constants/constants'
import { PetTypeFilter } from './components/filter/PetTypeFilter'
import { CategoryFilter } from './components/filter/CategoryFilter'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/commons/button/Button'
import { useUserStore } from '@/store/userStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useFilterStore } from '@/store/filterStore'
import { Z_INDEX } from '@/constants/ui'
import HomeSkeleton from './components/product-section/HomeSkeleton'

function Home() {
  const { isLogin, user } = useUserStore()
  const isMd = useMediaQuery('(min-width: 768px)')

  // SSR-safe: 초기에는 비로그인 상태로 렌더링, 마운트 후 실제 상태로 업데이트
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  useEffect(() => {
    setIsLoggedIn(isLogin())
  }, [isLogin, user])
  const searchParams = useSearchParams()
  const router = useRouter()
  const keyword = searchParams.get('keyword') || ''
  const sortBy = searchParams.get('sortBy')
  const sortOrder = searchParams.get('sortOrder')

  const {
    activePetTypeTab,
    setActivePetTypeTab,
    selectedDetailPet,
    setSelectedDetailPet,
    selectedCategory,
    setSelectedCategory,
    selectedProductStatus,
    setSelectedProductStatus,
    selectedProductPrice,
    setSelectedProductPrice,
    selectedLocation,
    setSelectedLocation,
    selectedSort,
    setSelectedSort,
    activeProductTypeTab,
    setActiveProductTypeTab,
    resetFilters,
  } = useFilterStore()

  const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(false)

  // URL searchParams에서 초기값 설정 (마운트 시 1회)
  useEffect(() => {
    const petDetailType = searchParams.get('petDetailType')
    const categories = searchParams.get('categories')
    const productStatuses = searchParams.get('productStatuses')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')

    if (petDetailType) setSelectedDetailPet(petDetailType)
    if (categories) setSelectedCategory(categories)
    if (productStatuses) setSelectedProductStatus(productStatuses)
    if (minPrice) {
      setSelectedProductPrice({
        min: Number(minPrice),
        max: maxPrice ? Number(maxPrice) : null,
      })
    }

    if (sortBy) {
      const sortItem = SORT_TYPE.find((sort) => {
        if (sortBy === 'price') {
          return sortOrder === 'asc' ? sort.id === 'orderedLowPriced' : sort.id === 'orderedHighPriced'
        }
        return sort.id === sortBy
      })
      if (sortItem) setSelectedSort(sortItem.label)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDetailFilterToggle = useCallback((isOpen: boolean) => {
    setIsDetailFilterOpen(isOpen)
  }, [])

  /**
   * 무한 스크롤을 위한 React Query 설정
   * - queryKey: ['products', activeTab, selectedProductStatus] - 필터 변경 시 새로운 쿼리로 인식하여 데이터 refetch
   * - queryFn: 각 페이지를 가져오는 함수 (pageParam은 페이지 번호)
   * - getNextPageParam: 다음 페이지 번호를 결정하는 함수 (undefined 반환 시 더 이상 페이지 없음)
   * - initialPageParam: 첫 페이지 번호 (0부터 시작)
   */
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
    // queryKey에 activeTab과 selectedProductStatus 포함: 필터 변경 시 캐시를 분리
    queryKey: [
      'products',
      activeProductTypeTab,
      selectedDetailPet,
      selectedProductStatus,
      selectedProductPrice,
      selectedLocation,
      selectedCategory,
      activePetTypeTab,
      keyword,
      sortBy,
      sortOrder,
    ],

    // 각 페이지 데이터를 가져오는 함수
    queryFn: ({ pageParam = 0 }) => {
      // 현재 탭에 맞는 productType 파라미터 생성
      const productTypeCode = PRODUCT_TYPE_TABS.find((tab) => tab.id === activeProductTypeTab)?.code
      const petTypeCode = PET_TYPE_TABS.find((tab) => tab.id === activePetTypeTab)?.code

      // 'ALL'은 undefined로 변환 (API에 파라미터 전달하지 않음)
      const productType = productTypeCode === 'ALL' ? undefined : productTypeCode
      const petType = petTypeCode === 'ALL' ? undefined : petTypeCode

      // selectedSort(label)를 id로 변환
      // const sortItem = SORT_TYPE.find((sort) => sort.label === selectedSort)
      // const sortId = sortItem?.id === 'orderedLowPriced' ? 'asc' : sortItem?.id === 'orderedHighPriced' ? 'desc' : 'createdAt'

      // API 호출: 페이지 번호, 페이지 크기(20), productType 필터, productStatus 필터, 가격 필터, 지역 필터
      return fetchAllProducts(
        pageParam,
        20,
        productType,
        selectedProductStatus,
        selectedProductPrice?.min ?? null,
        selectedProductPrice?.max ?? null,
        selectedLocation?.sido ?? null,
        selectedLocation?.gugun ?? null,
        selectedCategory,
        petType,
        selectedDetailPet,
        keyword,
        sortBy,
        sortOrder
        // sortId
      )
    },

    // 다음 페이지 번호를 결정하는 함수 (무한 스크롤 핵심 로직)
    getNextPageParam: (lastPage) => {
      // API 응답에서 페이지 정보 추출
      const currentPage = lastPage.data.data.page // 현재 페이지 번호 (0-based)
      const totalPages = lastPage.data.data.totalPages // 전체 페이지 수
      const hasNext = lastPage.data.data.hasNext // 다음 페이지 존재 여부

      // hasNext와 totalPages 둘 다 확인하여 다음 페이지 존재 여부 판단
      if (hasNext && currentPage + 1 < totalPages) {
        // 다음 페이지 번호 반환 (이 값이 다음 queryFn의 pageParam으로 전달됨)
        return currentPage + 1
      }

      // undefined 반환 시 hasNextPage가 false가 되어 무한 스크롤 종료
      return undefined
    },

    // 첫 번째 페이지 번호 (0부터 시작)
    initialPageParam: 0,

    // 새로운 데이터를 가져오는 동안 이전 데이터 유지
    placeholderData: (previousData) => previousData,
    refetchOnMount: 'always',
  })

  // 모든 페이지의 상품을 하나의 배열로 합치기
  const allProducts = []
  if (data?.pages) {
    for (const page of data.pages) {
      allProducts.push(...page.data.data.content)
    }
  }

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
      router.push('/')
      resetFilters()
    },
    [router, resetFilters]
  )

  const toGoProductPostPage = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/product-post')
  }

  const totalElements = data?.pages?.[0]?.total || 0

  useEffect(() => {
    const hasDetailFilter = searchParams.has('productStatuses') || searchParams.has('minPrice') || searchParams.has('addressSido')

    if (hasDetailFilter) {
      setIsDetailFilterOpen(true)
    }
  }, [searchParams])

  if (error && !isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p>상품을 불러올 수 없습니다</p>
          <button onClick={() => window.location.reload()} className="text-blue-600 hover:text-blue-800">
            새로고침
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="pb-4xl bg-white pt-6">
        <div className="px-lg mx-auto max-w-7xl">
          <div className="flex flex-col gap-12">
            <div className="flex flex-col gap-7">
              <PetTypeFilter
                activeTab={activePetTypeTab}
                onTabChange={setActivePetTypeTab}
                selectedDetailPet={selectedDetailPet}
                onPetDetailTypeChange={setSelectedDetailPet}
                headingClassName="heading-h5"
              />
              <CategoryFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} headingClassName="heading-h5" />
              <DetailFilter
                isOpen={isDetailFilterOpen}
                onToggle={handleDetailFilterToggle}
                selectedProductStatus={selectedProductStatus}
                onProductStatusChange={setSelectedProductStatus}
                selectedPriceRange={selectedProductPrice}
                onMinPriceChange={setSelectedProductPrice}
                onLocationChange={setSelectedLocation}
                filterReset={filterReset}
                headingClassName="lg:text-base!"
              />
            </div>
            <div className="flex flex-col gap-3">
              <Tabs
                tabs={PRODUCT_TYPE_TABS}
                activeTab={activeProductTypeTab}
                onTabChange={(tabId) => setActiveProductTypeTab(tabId as ProductTypeTabId)}
                ariaLabel="상품 타입 분류"
              />
              {isLoading ? (
                <HomeSkeleton />
              ) : (
                <ProductsSection
                  products={allProducts}
                  totalElements={totalElements}
                  activeTab={activeProductTypeTab}
                  selectedSort={selectedSort as SORT_LABELS}
                  setSelectedSort={setSelectedSort}
                />
              )}
            </div>
          </div>
          {/* 무한 스크롤 감지용 요소 */}
          <div ref={targetRef} className="h-10" aria-hidden="true" />

          {isFetchingNextPage && (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" aria-label="상품 로딩 중" role="status"></div>
            </div>
          )}
        </div>
      </div>
      {isLoggedIn && (
        <div className={`fixed right-10 bottom-5 ${Z_INDEX.FLOATING_BUTTON}`}>
          <Button size={isMd ? 'lg' : 'md'} className="bg-primary-300 cursor-pointer text-white" icon={Plus} onClick={toGoProductPostPage}>
            상품등록
          </Button>
        </div>
      )}
    </>
  )
}

export default Home
