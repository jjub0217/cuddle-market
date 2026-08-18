'use client'

import ProfileData from '@/components/profile/ProfileData'
import Footer from '@/components/footer/Footer'
import { useEffect, useState } from 'react'
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
import { PAGE_CONTAINER_MD } from '@/constants/ui'
import { cn } from '@/lib/utils/cn'

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

  // ⚠️ **주소의 id 로 판단한다. 서버 응답을 기다리지 않는다.**
  //    전에는 user?.id === userData?.id 라 프로필을 받아 온 뒤에야 알 수 있었고,
  //    그래서 마이페이지로 튕기기 전에 요청 두 개가 먼저 나갔다
  //    (/profile/{id} · /profile/{id}/products). 주소에 이미 id 가 있는데
  //    굳이 물어본 셈이다(#869).
  const isMyProfile = user?.id != null && String(user.id) === id

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
    // 내 프로필이면 안 부른다 — 어차피 마이페이지로 보낸다(위 useEffect)
    enabled: !!id && !isMyProfile,
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
    enabled: !!id && !isMyProfile && isSalesTab,
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
    enabled: !!id && !isMyProfile && !isSalesTab,
  })

  const userProductData = isSalesTab ? userSellProductData : userRequestProductData
  const fetchNextPage = isSalesTab ? fetchNextSellPage : fetchNextRequestPage
  const hasNextPage = isSalesTab ? hasNextSellPage : hasNextRequestPage
  const isFetchingNextPage = isSalesTab ? isFetchingNextSellPage : isFetchingNextRequestPage
  const isLoadingUserProductData = isSalesTab ? isLoadingUserSellProductData : isLoadingUserRequestProductData
  const errorUserProductData = isSalesTab ? errorUserSellProductData : errorUserRequestProductData
  const activeTabLabel = isSalesTab ? '판매상품' : '판매요청'

  // 내 프로필이면 마이페이지로 보낸다. 이 화면은 남의 프로필을 보는 자리라,
  // 내 id 로 열면 요약 카운트도 사이드바도 없는 반쪽이 뜨고
  // 「신고하기」·「차단하기」가 **나 자신을 향해** 열린다(#869).
  useEffect(() => {
    if (isMyProfile) router.replace(ROUTES.MYPAGE)
  }, [isMyProfile, router])


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

  // ⚠️ 내 프로필이면 **아무것도 안 그린다.** 위 useEffect 가 마이페이지로 보내는 사이,
  //    쿼리를 꺼 둔 탓에 userData 가 없어 아래 「사용자를 찾을 수 없습니다」가 한 번 스친다.
  if (isMyProfile) return null

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
        <div className={PAGE_CONTAINER_MD}>
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
        <div className={cn(PAGE_CONTAINER_MD, 'flex min-h-screen flex-col md:min-h-0 md:flex-row md:gap-8')}>
          {/* ⚠️ showJoinDate — 가입일은 중고거래에서 **신뢰 신호**다. 「3년 된 사람」과
              「어제 가입한 사람」은 거래를 결정할 때 다르게 읽힌다. 예전에는 거꾸로
              프로필 수정 화면에만 있었다(ProfileUpdate.tsx 에서 뺐다) */}
          <ProfileData
            setIsWithdrawModalOpen={setIsWithdrawModalOpen}
            setIsReportModalOpen={setIsReportModalOpen}
            setIsBlockModalOpen={setIsBlockModalOpen}
            data={userData!}
            // isMyProfile 을 안 넘긴다 — 내 프로필이면 위에서 마이페이지로 보내므로
            // 여기까지 오는 것은 **늘 남의 프로필**이다(#869).
            unblockUser={unblockUser}
            showJoinDate
          />
          <section className="flex w-full flex-col gap-1 p-5 md:gap-6 md:p-0" aria-labelledby="user-product-heading">
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
