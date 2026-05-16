'use client'

import ProfileData from '@/components/profile/ProfileData'
import Footer from '@/components/footer/Footer'
import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api/api'
import ProductCard from '@/components/product/ProductCard'
import LoadMoreButton from '@/components/commons/button/LoadMoreButton'
import EmptyState from '@/components/EmptyState'
import { Package } from 'lucide-react'
import Tabs from '@/components/Tabs'
import { UnderlineTabs } from '@/components/UnderlineTabs'
import dynamic from 'next/dynamic'
const UserReportModal = dynamic(() => import('@/components/modal/UserReportModal'))
const BlockModal = dynamic(() => import('@/components/modal/BlockModal'))
import { useUserStore } from '@/store/userStore'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import Spinner from '@/components/commons/spinner/Spinner'
import { ROUTES } from '@/constants/routes'

const USER_PAGE_TABS = [
  { id: 'tab-sales', label: '판매상품', code: 'SELL' },
  { id: 'tab-purchases', label: '판매요청', code: 'REQUEST' },
] as const

type UserPageTabId = (typeof USER_PAGE_TABS)[number]['id']

function UserPage() {
  const { user } = useUserStore()
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()

  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as UserPageTabId | null
  const activeTab: UserPageTabId = tabParam && USER_PAGE_TABS.some((t) => t.id === tabParam) ? tabParam : 'tab-sales'
  const isSalesTab = activeTab === 'tab-sales'

  const [, setIsWithdrawModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [unblockError, setUnblockError] = useState<React.ReactNode | null>(null)

  const handleTabChange = (tabId: string) => {
    const next = new URLSearchParams(searchParams.toString())
    next.set('tab', tabId)
    router.replace(`?${next.toString()}`)
  }

  const {
    data: userData,
    isLoading: isLoadingUserData,
    error: errorUserData,
  } = useQuery({
    queryKey: ['userPage', id],
    queryFn: async () => {
      const response = await api.get(`/profile/${id}`)
      return response.data.data
    },
    enabled: !!id,
    refetchOnWindowFocus: false,
  })

  const {
    data: userSellProductData,
    fetchNextPage: fetchNextSellPage,
    hasNextPage: hasNextSellPage,
    isFetchingNextPage: isFetchingNextSellPage,
    isLoading: isLoadingUserSellProductData,
    error: errorUserSellProductData,
  } = useInfiniteQuery({
    queryKey: ['userProducts', id, 'SELL'],
    queryFn: async ({ pageParam }) => {
      const response = await api.get(`/profile/${id}/products`, {
        params: { page: pageParam, size: 10 },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: !!id && isSalesTab,
  })

  const {
    data: userRequestProductData,
    fetchNextPage: fetchNextRequestPage,
    hasNextPage: hasNextRequestPage,
    isFetchingNextPage: isFetchingNextRequestPage,
    isLoading: isLoadingUserRequestProductData,
    error: errorUserRequestProductData,
  } = useInfiniteQuery({
    queryKey: ['userProducts', id, 'REQUEST'],
    queryFn: async ({ pageParam }) => {
      const response = await api.get(`/profile/${id}/purchase-requests`, {
        params: { page: pageParam, size: 10 },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: !!id && !isSalesTab,
  })

  const userProductData = isSalesTab ? userSellProductData : userRequestProductData
  const fetchNextPage = isSalesTab ? fetchNextSellPage : fetchNextRequestPage
  const hasNextPage = isSalesTab ? hasNextSellPage : hasNextRequestPage
  const isFetchingNextPage = isSalesTab ? isFetchingNextSellPage : isFetchingNextRequestPage
  const isLoadingUserProductData = isSalesTab ? isLoadingUserSellProductData : isLoadingUserRequestProductData
  const errorUserProductData = isSalesTab ? errorUserSellProductData : errorUserRequestProductData
  const activeTabLabel = isSalesTab ? '판매상품' : '판매요청'

  const isMyProfile = user?.id === userData?.id

  const { mutate: unblockUser } = useMutation({
    mutationFn: () => api.delete(`/reports/blocks/users/${userData?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPage', id] })
    },
    onError: () => {
      setUnblockError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">차단 해제에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    },
  })

  const totalProducts = userProductData?.pages[0]?.total ?? 0
  const allProducts = userProductData?.pages.flatMap((page) => page.content) ?? []

  if ((isLoadingUserData && !userData) || (isLoadingUserProductData && !userProductData)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  if (errorUserData || errorUserProductData || !userData || !userProductData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col gap-4">
          <p>사용자 정보를 불러올 수 없습니다</p>
          <button onClick={() => router.push(ROUTES.HOME)} className="text-blue-600 hover:text-blue-800">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="md:pb-4xl relative pt-0 md:pt-8">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence>
            {unblockError ? (
              <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 md:pt-8">
                <InlineNotification type="error" onClose={() => setUnblockError(null)}>
                  {unblockError}
                </InlineNotification>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-7 bg-gray-100/30 p-3 md:min-h-0 md:flex-row md:gap-8 md:bg-transparent md:p-0">
          <ProfileData
            setIsWithdrawModalOpen={setIsWithdrawModalOpen}
            setIsReportModalOpen={setIsReportModalOpen}
            setIsBlockModalOpen={setIsBlockModalOpen}
            data={userData!}
            isMyProfile={isMyProfile}
            unblockUser={unblockUser}
          />
          <section className="flex w-full flex-col gap-1 md:gap-6" aria-labelledby="user-product-heading">
            <h4 id="user-product-heading" className="sr-only">
              {userData?.nickname}님의 {activeTabLabel}
            </h4>
            <div className="md:hidden">
              <UnderlineTabs
                tabs={USER_PAGE_TABS}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                ariaLabel="유저 상품 종류 메뉴"
              />
            </div>
            <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
              <Tabs
                tabs={USER_PAGE_TABS}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                ariaLabel="유저 상품 종류 메뉴"
                variant="card-pill"
              />
              <p className="text-sm text-gray-500">총 {totalProducts}개</p>
            </div>
            <div className="border-outline-variant/40 rounded-xl py-5 md:border md:p-5">
              <div className="gap-lg flex flex-col">
                {allProducts.length ? (
                  <>
                    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {allProducts.map((product) => (
                        <li key={product.id}>
                          <ProductCard data={product} hideProductType />
                        </li>
                      ))}
                    </ul>
                    {hasNextPage ? <LoadMoreButton onClick={() => fetchNextPage()} isLoading={isFetchingNextPage} /> : null}
                  </>
                ) : (
                  <EmptyState icon={Package} title={`등록한 ${activeTabLabel}이 없습니다`} />
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
      <UserReportModal
        isOpen={isReportModalOpen}
        onCancel={() => setIsReportModalOpen(false)}
        userNickname={userData.nickname}
        userId={Number(id)}
      />
      <BlockModal
        isOpen={isBlockModalOpen}
        onCancel={() => setIsBlockModalOpen(false)}
        userNickname={userData.nickname}
        userId={Number(id)}
      />
      <Footer />
    </>
  )
}

export default UserPage
