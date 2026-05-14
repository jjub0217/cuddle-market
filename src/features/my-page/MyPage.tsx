'use client'

import { useUserStore } from '@/store/userStore'
import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useMutation, useInfiniteQuery, useQueryClient, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/api'
import Tabs from '@/components/Tabs'
import {
  MY_PAGE_NAV,
  MY_PAGE_TABS,
  STATUS_EN_TO_KO,
  myPageIconMap,
  type MyPageNavId,
  type MyPageTabId,
  type TransactionStatus,
} from '@/constants/constants'
import MyPagePanel from './components/MyPagePanel'
import MyDashboard from './components/MyDashboard'
import MyActivityPanel from './components/MyActivityPanel'
import dynamic from 'next/dynamic'
import type { WithDrawFormValues } from '@/components/modal/WithdrawModal'
const DeleteConfirmModal = dynamic(() => import('@/components/modal/DeleteConfirmModal'))
const WithdrawModal = dynamic(() => import('@/components/modal/WithdrawModal'))
import ProfileData from '@/components/profile/ProfileData'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import Spinner from '@/components/commons/spinner/Spinner'
import Link from 'next/link'
import Button from '@/components/commons/button/Button'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

function MyPage() {
  const [deleteError, setDeleteError] = useState<React.ReactNode | null>(null)

  const { user, _hasHydrated, clearAll, updateUserProfile, setRedirectUrl } = useUserStore()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const [unblockError, setUnblockError] = useState<React.ReactNode | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawError, setWithdrawError] = useState<React.ReactNode | null>(null)
  const [activeTradeStatus, setActiveTradeStatus] = useState<TransactionStatus | 'ALL'>('ALL')
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number
    title: string
    price: number
    mainImageUrl: string
  } | null>(null)
  const tabParam = searchParams.get('tab') as MyPageTabId | null
  const navParam = searchParams.get('nav') as MyPageNavId | null
  const activeMyPageTab = tabParam && MY_PAGE_TABS.some((tab) => tab.id === tabParam) ? tabParam : 'tab-sales'
  const activeMyPageNav = navParam && MY_PAGE_NAV.some((tab) => tab.id === navParam) ? navParam : 'nav-dash'
  const activeTabCode = MY_PAGE_TABS.find((tab) => tab.id === activeMyPageTab)?.code ?? 'SELL'
  const isMd = useMediaQuery('(min-width: 768px)')

  const {
    data: myData,
    isLoading: isLoadingMyData,
    error: errorMyData,
  } = useQuery({
    queryKey: ['mypage', user?.id],
    queryFn: async () => {
      const response = await api.get('/profile/me')
      return response.data.data
    },
    enabled: !!user,
  })

  const {
    data: myProductsData,
    fetchNextPage: fetchNextProducts,
    hasNextPage: hasNextProducts,
    isFetchingNextPage: isFetchingNextProducts,
    isLoading: isLoadingMyProductData,
    error: errorMyProductData,
  } = useInfiniteQuery({
    queryKey: ['myProducts', user?.id],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/profile/me/products', { params: { page: pageParam, size: 10 } })
      return response.data.data
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: !!user,
  })

  const {
    data: myRequestData,
    fetchNextPage: fetchNextRequests,
    hasNextPage: hasNextRequests,
    isFetchingNextPage: isFetchingNextRequests,
    error: errorMyRequestData,
  } = useInfiniteQuery({
    queryKey: ['myRequest', user?.id],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/profile/me/purchase-requests', { params: { page: pageParam, size: 10 } })
      return response.data.data
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: activeMyPageTab === 'tab-purchases' || activeMyPageNav === 'nav-dash',
  })

  const {
    data: myFavoriteData,
    fetchNextPage: fetchNextFavorites,
    hasNextPage: hasNextFavorites,
    isFetchingNextPage: isFetchingNextFavorites,
    error: errorMyFavoritetData,
  } = useInfiniteQuery({
    queryKey: ['myFavorite', user?.id],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/profile/me/favorites', { params: { page: pageParam, size: 10 } })
      return response.data.data
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: activeMyPageTab === 'tab-wishlist' || activeMyPageNav === 'nav-dash',
  })

  const {
    data: myBlockedData,
    fetchNextPage: fetchNextBlocked,
    hasNextPage: hasNextBlocked,
    isFetchingNextPage: isFetchingNextBlocked,
    error: errorMyFBlockedData,
  } = useInfiniteQuery({
    queryKey: ['myBlocked', user?.id],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/profile/me/blocked-users', { params: { page: pageParam, size: 10 } })
      const data = response.data.data
      const paged = data.blockedUsers ?? data
      const blockedList = paged.content ?? []
      return {
        content: blockedList.map(
          (u: {
            blockedUserId: number
            blockedUserNickname?: string
            nickname?: string
            profileImageUrl?: string
            blockedAt: string
          }) => ({
            blockedUserId: u.blockedUserId,
            nickname: u.nickname || u.blockedUserNickname || '',
            profileImageUrl: u.profileImageUrl,
            blockedAt: u.blockedAt,
          })
        ),
        page: paged.page ?? 0,
        hasNext: paged.hasNext ?? false,
        total: paged.total ?? paged.totalElements ?? 0,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: activeMyPageTab === 'tab-blocked',
  })

  const paginationProps = {
    'tab-sales': { fetchNextPage: fetchNextProducts, hasNextPage: hasNextProducts, isFetchingNextPage: isFetchingNextProducts },
    'tab-purchases': {
      fetchNextPage: fetchNextRequests,
      hasNextPage: hasNextRequests,
      isFetchingNextPage: isFetchingNextRequests,
    },
    'tab-wishlist': {
      fetchNextPage: fetchNextFavorites,
      hasNextPage: hasNextFavorites,
      isFetchingNextPage: isFetchingNextFavorites,
    },
    'tab-blocked': { fetchNextPage: fetchNextBlocked, hasNextPage: hasNextBlocked, isFetchingNextPage: isFetchingNextBlocked },
  }[activeMyPageTab]

  const isPurchasesTabActive = activeMyPageTab === 'tab-purchases'
  // 백엔드 TradeStatus: 판매 상품은 SELLING/RESERVED/COMPLETED, 판매 요청은 SELLING/COMPLETED만 사용 (RESERVED 미사용)
  const tradeStatusTabs = isPurchasesTabActive
    ? [
        { id: 'ALL', label: '전체', code: 'ALL' },
        { id: 'SELLING', label: '요청중', code: 'SELLING' },
        { id: 'COMPLETED', label: '구매완료', code: 'COMPLETED' },
      ]
    : [
        { id: 'ALL', label: '전체', code: 'ALL' },
        ...STATUS_EN_TO_KO.filter(
          (status): status is { value: TransactionStatus; name: string; bgColor: string } => status.value !== null
        ).map((status) => ({
          id: status.value,
          label: status.name,
          code: status.value,
        })),
      ]

  const filteredMyProductsData =
    activeMyPageTab === 'tab-sales' && activeTradeStatus !== 'ALL'
      ? myProductsData?.pages.flatMap((page) => page.content).filter((product) => product.tradeStatus === activeTradeStatus)
      : myProductsData?.pages.flatMap((page) => page.content)

  const filteredMyRequestData =
    activeTradeStatus === 'ALL'
      ? myRequestData?.pages.flatMap((page) => page.content)
      : myRequestData?.pages.flatMap((page) => page.content)?.filter((p) => p.tradeStatus === activeTradeStatus)

  const { mutate: deleteProductMutate } = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => {
      if (activeMyPageTab === 'tab-sales') {
        queryClient.invalidateQueries({ queryKey: ['myProducts', user?.id] })
      } else if (activeMyPageTab === 'tab-purchases') {
        queryClient.invalidateQueries({ queryKey: ['myRequest', user?.id] })
      }
      setIsModalOpen(false)
      setSelectedProduct(null)
    },
    onError: () => {
      setDeleteError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">상품 삭제에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    },
  })

  // NAV → TAB 매핑 (sales/purchases/wishlist는 기존 탭 패널을 그대로 보여줌)
  const NAV_TO_TAB: Record<string, MyPageTabId | null> = {
    DASH_BOARD: null,
    SELL: 'tab-sales',
    PURCHASES: 'tab-purchases',
    FAVORITE: 'tab-wishlist',
    ACTIVITY: null,
    BLOCKED: 'tab-blocked',
  }

  const handleNavChange = (navId: MyPageNavId) => {
    const navItem = MY_PAGE_NAV.find((n) => n.id === navId)
    if (!navItem) return
    const tabId = NAV_TO_TAB[navItem.code]
    const params = new URLSearchParams()
    params.set('nav', navId)
    if (tabId) params.set('tab', tabId)
    router.replace(`?${params.toString()}`)
  }

  const handleConfirmModal = (e: React.MouseEvent, id: number, title: string, price: number, mainImageUrl: string) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedProduct({ id, title, price, mainImageUrl })
    setIsModalOpen(true)
  }

  const handleDelete = (id: number) => {
    deleteProductMutate(id)
  }

  const handleWithdraw = async (data: WithDrawFormValues) => {
    try {
      await api.delete('/auth/withdraw', { data: { reason: data.reason, detailReason: data.detailReason } })
      clearAll()
      router.push('/')
    } catch {
      setWithdrawError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">회원탈퇴에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
  }

  const { mutate: unblockUser } = useMutation({
    mutationFn: (blockedUserId: number) => api.delete(`/reports/blocks/users/${blockedUserId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBlocked'] })
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

  useEffect(() => {
    if (myData) {
      updateUserProfile({
        profileImageUrl: myData.profileImageUrl,
        nickname: myData.nickname,
        name: myData.name,
        introduction: myData.introduction,
        birthDate: myData.birthDate,
        email: myData.email,
        addressSido: myData.addressSido,
        addressGugun: myData.addressGugun,
        createdAt: myData.createdAt,
      })
    }
  }, [myData, updateUserProfile])

  useEffect(() => {
    if (_hasHydrated && !user?.id) {
      setRedirectUrl(pathname)
      router.push('/auth/login')
    }
  }, [_hasHydrated, user?.id, pathname, router, setRedirectUrl])

  if ((isLoadingMyData && !myData) || (isLoadingMyProductData && !myProductsData)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  if (errorMyData || errorMyProductData || errorMyRequestData || errorMyFavoritetData || errorMyFBlockedData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col gap-4">
          <p>내 정보를 불러올 수 없습니다</p>
          <Button variant="link" onClick={() => router.push('/')} className="text-primary hover:underline">
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  if (!_hasHydrated || !user?.id) {
    return null
  }

  return (
    <>
      <div className="pb-4xl pt-0 md:pt-8">
        <h1 className="sr-only">마이페이지</h1>
        <div className="mx-auto flex max-w-7xl flex-col gap-3.5 md:flex-row md:gap-8">
          <div className="flex flex-col gap-3">
            <ProfileData setIsWithdrawModalOpen={setIsWithdrawModalOpen} data={myData!} isMyProfile />
            <div role="tablist" aria-label="마이페이지 메뉴" className="flex flex-col gap-2">
              {MY_PAGE_NAV.map((tab) => {
                const isActive = activeMyPageNav === tab.id
                const Icon = myPageIconMap[tab.code]
                return (
                  <button
                    key={tab.id}
                    id={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.code}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => handleNavChange(tab.id)}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                      isActive
                        ? 'bg-primary-container text-on-primary-container'
                        : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface'
                    )}
                  >
                    <Icon size={16} />
                    <span className="text-sm md:text-base md:font-semibold">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <section className="relative flex flex-1 flex-col gap-3.5 md:gap-7">
            <AnimatePresence>
              {unblockError ? (
                <div className="absolute top-11 left-1/2 z-50 w-11/12 -translate-x-1/2 md:w-auto md:pt-8">
                  <InlineNotification type="error" onClose={() => setUnblockError(null)}>
                    {unblockError}
                  </InlineNotification>
                </div>
              ) : null}
            </AnimatePresence>
            {(activeMyPageNav === 'nav-sales' || activeMyPageNav === 'nav-purchases') &&
            (activeMyPageTab === 'tab-sales' || activeMyPageTab === 'tab-purchases') ? (
              <div className="px-5 md:px-0">
                <Tabs
                  tabs={tradeStatusTabs}
                  activeTab={activeTradeStatus}
                  onTabChange={(tabId) => setActiveTradeStatus(tabId as TransactionStatus | 'ALL')}
                  ariaLabel={activeMyPageTab === 'tab-sales' ? '판매 상태 메뉴' : '구매 상태 메뉴'}
                  variant="card-pill"
                />
              </div>
            ) : null}

            {activeMyPageNav === 'nav-dash' ? (
              <MyDashboard
                profile={myData}
                myProducts={myProductsData?.pages.flatMap((page) => page.content)}
                myRequests={myRequestData?.pages.flatMap((page) => page.content)}
                myFavorites={myFavoriteData?.pages.flatMap((page) => page.content)}
              />
            ) : activeMyPageNav === 'nav-activity' ? (
              <MyActivityPanel />
            ) : (
              <MyPagePanel
                activeTabCode={activeTabCode}
                activeMyPageTab={activeMyPageTab}
                activeTradeStatus={activeTradeStatus}
                myProductsData={filteredMyProductsData}
                myProductsTotal={
                  activeMyPageTab === 'tab-sales' ? filteredMyProductsData?.length : myProductsData?.pages[0]?.total
                }
                myRequestData={filteredMyRequestData}
                myRequestTotal={activeTradeStatus === 'ALL' ? myRequestData?.pages[0]?.total : filteredMyRequestData?.length}
                myFavoriteData={myFavoriteData?.pages.flatMap((page) => page.content)}
                myFavoriteTotal={myFavoriteData?.pages[0]?.total}
                myBlockedData={myBlockedData?.pages.flatMap((page) => page.content)}
                myBlockedTotal={myBlockedData?.pages[0]?.total}
                {...paginationProps}
                handleConfirmModal={handleConfirmModal}
                unblockUser={unblockUser}
              />
            )}
          </section>
        </div>
      </div>
      <DeleteConfirmModal
        isOpen={isModalOpen}
        product={selectedProduct}
        onConfirm={handleDelete}
        onCancel={() => setIsModalOpen(false)}
        error={deleteError}
        onClearError={() => setDeleteError(null)}
      />
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onConfirm={handleWithdraw}
        onCancel={() => setIsWithdrawModalOpen(false)}
        error={withdrawError}
        onClearError={() => setWithdrawError(null)}
      />
    </>
  )
}

export default MyPage
