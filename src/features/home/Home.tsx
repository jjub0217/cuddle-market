'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useState, useCallback, useEffect, useMemo } from 'react'
import Tabs from '@/components/Tabs'
import { DetailFilter } from '@/features/home/components/filter/DetailFilter'
import { ProductsSection } from '@/features/home/components/product-section/ProductsSection'
import { fetchAllProducts } from '@/lib/api/products'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { PRODUCT_TYPE_TABS, PET_TYPE_TABS, type ProductTypeTabId, SORT_TYPE, type PetTypeTabId } from '@/constants/constants'
import { PetTypeFilter } from './components/filter/PetTypeFilter'
import { CategoryFilter } from './components/filter/CategoryFilter'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import Button from '@/components/commons/button/Button'
import { useUserStore } from '@/store/userStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Z_INDEX } from '@/constants/ui'
import HomeSkeleton from './components/product-section/HomeSkeleton'

function Home() {
  const { isLogin } = useUserStore()
  const isLoggedIn = isLogin()
  const isMd = useMediaQuery('(min-width: 768px)')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // 탭 상태 (새로고침 시 초기화)
  const [activePetTypeTab, setActivePetTypeTab] = useState<PetTypeTabId>('tab-all')
  const [activeProductTypeTab, setActiveProductTypeTab] = useState<ProductTypeTabId>('tab-all')

  // URL에서 필터 값 직접 파싱 (Single Source of Truth)
  const keyword = searchParams.get('keyword') || ''
  const sortBy = searchParams.get('sortBy')
  const sortOrder = searchParams.get('sortOrder')
  const selectedDetailPet = searchParams.get('petDetailType') || null
  const selectedCategory = searchParams.get('categories') || null
  const selectedProductStatus = searchParams.get('productStatuses') || null
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const selectedProductPrice = minPrice ? { min: Number(minPrice), max: maxPrice ? Number(maxPrice) : null } : null
  const addressSido = searchParams.get('addressSido') || ''
  const addressGugun = searchParams.get('addressGugun') || ''
  const selectedLocation = addressSido ? { sido: addressSido, gugun: addressGugun || null } : null

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

  const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(false)

  const handleDetailFilterToggle = useCallback((isOpen: boolean) => {
    setIsDetailFilterOpen(isOpen)
  }, [])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useInfiniteQuery({
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

    queryFn: ({ pageParam = 0 }) => {
      const productTypeCode = PRODUCT_TYPE_TABS.find((tab) => tab.id === activeProductTypeTab)?.code
      const petTypeCode = PET_TYPE_TABS.find((tab) => tab.id === activePetTypeTab)?.code

      // 'ALL'은 undefined로 변환 (API에 파라미터 전달하지 않음)
      const productType = productTypeCode === 'ALL' ? undefined : productTypeCode
      const petType = petTypeCode === 'ALL' ? undefined : petTypeCode

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
        sortOrder,
      )
    },

    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.data.data.page
      const totalPages = lastPage.data.data.totalPages
      const hasNext = lastPage.data.data.hasNext

      if (hasNext && currentPage + 1 < totalPages) {
        return currentPage + 1
      }

      return undefined
    },

    initialPageParam: 0,

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
      setActivePetTypeTab('tab-all')
      setActiveProductTypeTab('tab-all')
      router.push(pathname)
    },
    [router, pathname],
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
                headingClassName="heading-h5"
              />
              <CategoryFilter selectedCategory={selectedCategory} headingClassName="heading-h5" />
              <DetailFilter
                isOpen={isDetailFilterOpen}
                onToggle={handleDetailFilterToggle}
                selectedProductStatus={selectedProductStatus}
                selectedPriceRange={selectedProductPrice}
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
                  selectedSort={selectedSort}
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
