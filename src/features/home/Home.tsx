'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useState, useCallback, useMemo, useEffect } from 'react'
import Tabs from '@/components/Tabs'
import { DetailFilter } from '@/features/home/components/filter/DetailFilter'
import { ProductsSection } from '@/features/home/components/product-section/ProductsSection'
import { fetchGraphQL } from '@/lib/api/graphql'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { PRODUCT_TYPE_TABS, PET_TYPE_TABS, type ProductTypeTabId, SORT_TYPE, type PetTypeTabId } from '@/constants/constants'
import { PetTypeFilter } from './components/filter/PetTypeFilter'
import { CategoryFilter } from './components/filter/CategoryFilter'
import { useRouter } from 'next/navigation'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import { Plus } from 'lucide-react'
import Button from '@/components/commons/button/Button'
import { useUserStore } from '@/store/userStore'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Z_INDEX } from '@/constants/ui'
import HomeSkeleton from './components/product-section/HomeSkeleton'
import { productListQueryKey, extractProductSearchParams } from '@/lib/queries/productQueryKeys'

function Home() {
  const { isLogin } = useUserStore()
  const hasHydrated = useUserStore((state) => state._hasHydrated)
  const isLoggedIn = hasHydrated && isLogin()
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => { setIsHydrated(true) }, [])
  const isMd = useMediaQuery('(min-width: 768px)')
  const { searchParams, pathname, push } = useFilterNavigation()
  const router = useRouter()

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
  const [isDetailFilterOpen, setIsDetailFilterOpen] = useState(hasDetailFilter)
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
            content { id title price mainImageUrl petDetailType productStatus productType tradeStatus createdAt viewCount favoriteCount isFavorite }
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

  const toGoProductPostPage = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push('/product-post')
  }

  const totalElements = data?.pages?.[0]?.totalElements || 0

  if (!isHydrated) {
    return (
      <div className="pb-4xl pt-6">
        <h1 className="sr-only">커들마켓</h1>
        <div className="px-lg mx-auto max-w-7xl">
          <div className="flex flex-col gap-12">
            <section className="flex flex-col gap-7">
              {/* 필터 스켈레톤 */}
              <div className="flex flex-col gap-3">
                <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
                <div className="flex gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 w-16 animate-pulse rounded-full bg-gray-200" />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 w-20 animate-pulse rounded-full bg-gray-200" />
                  ))}
                </div>
              </div>
              {/* 세부 필터 스켈레톤 */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
                  <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            </section>
            <section className="flex flex-col gap-2.5">
              {/* 탭 스켈레톤 */}
              <div className="flex gap-4 border-b-[1.5px] border-b-primary-200 pb-1">
                {['전체', '판매', '판매요청'].map((label) => (
                  <div key={label} className="h-8 w-16 animate-pulse rounded bg-gray-200" />
                ))}
              </div>
              <HomeSkeleton />
            </section>
          </div>
        </div>
      </div>
    )
  }

  if (error && !isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p>상품을 불러올 수 없습니다</p>
          <button onClick={() => refetch()} className="text-blue-600 hover:text-blue-800">
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="pb-4xl pt-6">
        <h1 className="sr-only">커들마켓</h1>
        <div className="px-lg mx-auto max-w-7xl">
          <div className="flex flex-col gap-12">
            <section aria-label="상품 필터" className="flex flex-col gap-7" data-nosnippet>
              <PetTypeFilter
                activeTab={activePetTypeTab}
                onTabChange={handlePetTypeTabChange}
                selectedDetailPet={selectedDetailPet}
                headingClassName="text-base font-semibold"
              />
              <CategoryFilter selectedCategory={selectedCategory} headingClassName="text-base font-semibold" />
              <DetailFilter
                isOpen={isDetailFilterOpen}
                onToggle={handleDetailFilterToggle}
                selectedProductStatus={selectedProductStatus}
                selectedPriceRange={selectedProductPrice}
                filterReset={filterReset}
                headingClassName="text-sm font-medium"
              />
            </section>
            <section aria-label="상품 목록" className="flex flex-col gap-2.5">
              <div className="border-b-[1.5px] border-b-primary-200 pb-1" data-nosnippet>
                <Tabs
                  tabs={PRODUCT_TYPE_TABS}
                  activeTab={activeProductTypeTab}
                  onTabChange={handleProductTypeTabChange}
                  ariaLabel="상품 타입 분류"
                />
              </div>
              {isLoading && allProducts.length === 0 ? (
                <HomeSkeleton />
              ) : (
                <ProductsSection
                  products={allProducts}
                  totalElements={totalElements}
                  activeTab={activeProductTypeTab}
                  selectedSort={selectedSort}
                />
              )}
            </section>
          </div>
          {/* 무한 스크롤 감지용 요소 */}
          <div ref={targetRef} className="h-10" aria-hidden="true" />

          {isFetchingNextPage ? (
            <div className="flex items-center justify-center py-8">
              <div role="status" aria-live="polite">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" aria-hidden="true"></div>
                <span className="sr-only">상품 로딩 중</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {isLoggedIn ? (
        <div className={`fixed right-10 bottom-5 max-md:bottom-18 max-md:right-4 ${Z_INDEX.FLOATING_BUTTON}`}>
          <Button
            size={isMd ? 'lg' : 'md'}
            className="bg-primary-300 cursor-pointer text-white"
            icon={Plus}
            onClick={toGoProductPostPage}
          >
            상품등록
          </Button>
        </div>
      ) : null}
    </>
  )
}

export default Home
