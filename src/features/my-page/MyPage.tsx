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
import Button from '@/components/commons/button/Button'
import { cn } from '@/lib/utils/cn'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Z_INDEX } from '@/constants/ui'
import { ArrowLeft, Tag, Handbag, ChevronRight, Heart, MessageSquareText, UserX, Headphones, LogOut, UserMinus } from 'lucide-react'
import Link from 'next/link'
import { useLogout } from '@/hooks/useLogout'

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
  const { openLogoutConfirm } = useLogout()
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

  // 모바일에서는 사이드 nav 숨김 + 대시보드 강제 노출
  const isMobile = useMediaQuery('(max-width: 767px)')
  const effectiveNav: MyPageNavId = isMobile ? 'nav-dash' : activeMyPageNav
  const [isProfileFullViewOpen, setIsProfileFullViewOpen] = useState(false)
  // 모바일 메뉴 클릭 시 풀스크린에 표시할 탭 (null이면 닫힘; 'activity'는 MyActivityPanel 표시)
  const [mobilePanelTab, setMobilePanelTab] = useState<MyPageTabId | 'activity' | null>(null)

  // 모바일 오버레이(프로필/메뉴 패널)는 URL을 바꾸지 않는 단순 state이므로,
  // 기기 뒤로가기를 누르면 패널이 닫히는 대신 직전 페이지(예: 유저 프로필)로 빠져버린다.
  // 패널을 열 때 history 엔트리를 push해서 뒤로가기가 "패널 닫기"로 동작하도록 한다.
  const openMobilePanel = (tab: MyPageTabId | 'activity') => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ cmMobilePanel: tab }, '')
    }
    setMobilePanelTab(tab)
  }

  const openProfileFullView = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ cmMobileProfile: true }, '')
    }
    setIsProfileFullViewOpen(true)
  }

  const closeMobileOverlay = () => {
    if (typeof window !== 'undefined') {
      window.history.back()
    } else {
      setMobilePanelTab(null)
      setIsProfileFullViewOpen(false)
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      setMobilePanelTab(null)
      setIsProfileFullViewOpen(false)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const mobilePanelTitle =
    mobilePanelTab === 'tab-sales'
      ? '판매 내역'
      : mobilePanelTab === 'tab-purchases'
        ? '구매 내역'
        : mobilePanelTab === 'tab-wishlist'
          ? '찜한 상품'
          : mobilePanelTab === 'tab-blocked'
            ? '차단 유저'
            : mobilePanelTab === 'activity'
              ? '내 글'
              : ''
  const mobilePanelTabCode =
    mobilePanelTab && mobilePanelTab !== 'activity'
      ? (MY_PAGE_TABS.find((tab) => tab.id === mobilePanelTab)?.code ?? 'SELL')
      : 'SELL'
  const mobileTradeStatusTabs =
    mobilePanelTab === 'tab-purchases'
      ? [
          { id: 'ALL', label: '전체', code: 'ALL' },
          { id: 'SELLING', label: '요청중', code: 'SELLING' },
          { id: 'COMPLETED', label: '구매완료', code: 'COMPLETED' },
        ]
      : [
          { id: 'ALL', label: '전체', code: 'ALL' },
          { id: 'SELLING', label: '판매중', code: 'SELLING' },
          { id: 'RESERVED', label: '예약중', code: 'RESERVED' },
          { id: 'COMPLETED', label: '판매완료', code: 'COMPLETED' },
        ]
  const activeTabCode = MY_PAGE_TABS.find((tab) => tab.id === activeMyPageTab)?.code ?? 'SELL'

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
    enabled: activeMyPageTab === 'tab-purchases' || effectiveNav === 'nav-dash',
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
    enabled: activeMyPageTab === 'tab-wishlist' || effectiveNav === 'nav-dash',
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
      <div className="pb-4xl bg-gray-100/30 pt-0 md:bg-transparent md:pt-8">
        <h1 className="sr-only">마이페이지</h1>
        <div className="mx-auto flex max-w-7xl flex-col gap-3.5 md:flex-row md:gap-8">
          <div className="flex flex-col gap-2 p-2 md:p-0">
            {/* 모바일: 압축 프로필 카드 (클릭 시 풀스크린 진입) */}
            <button
              type="button"
              onClick={openProfileFullView}
              aria-label="프로필 자세히 보기"
              className="border-outline-variant/40 flex w-full cursor-pointer flex-col gap-3 rounded-2xl border bg-white p-5 text-left transition-colors hover:bg-gray-50 md:hidden"
            >
              <div className="flex items-start gap-3.5">
                <div className="bg-primary-50 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full">
                  {myData?.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={myData.profileImageUrl} alt={myData.nickname} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-semibold text-[#825500]">{myData?.nickname?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-base font-bold text-[#1c1b1b]">{myData?.nickname}</p>
                  <p className="text-sm text-gray-500">{`${myData?.addressSido ?? ''} ${myData?.addressGugun ?? ''}`.trim()}</p>
                </div>
                <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
              </div>
              {myData?.introduction ? <p className="line-clamp-1 text-sm text-gray-500">{myData.introduction}</p> : null}
            </button>

            {/* 모바일 전용 섹션 */}
            <section className="flex flex-col gap-2 md:hidden" aria-label="마이페이지 모바일 콘텐츠">
              <div className="border-outline-variant/40 flex flex-col gap-2 rounded-2xl border bg-white p-5">
                <h2 className="text-sm font-bold text-[#1c1b1b]">내 상품 관리</h2>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => openMobilePanel('tab-sales')}
                    className="text-on-surface flex cursor-pointer items-center gap-3 py-2"
                  >
                    <Tag size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">판매 내역</span>
                    <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openMobilePanel('tab-purchases')}
                    className="text-on-surface flex cursor-pointer items-center gap-3 py-2"
                  >
                    <Handbag size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">구매내역</span>
                    <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openMobilePanel('tab-wishlist')}
                    className="text-on-surface flex cursor-pointer items-center gap-3 py-2"
                  >
                    <Heart size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">찜한 상품</span>
                    <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                </div>
              </div>

              <div className="border-outline-variant/40 flex flex-col gap-2 rounded-2xl border bg-white p-5">
                <h2 className="text-sm font-bold text-[#1c1b1b]">나의 활동</h2>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => openMobilePanel('activity')}
                    className="text-on-surface flex cursor-pointer items-center gap-3 py-2"
                  >
                    <MessageSquareText size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">내 글</span>
                    <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openMobilePanel('tab-blocked')}
                    className="text-on-surface flex cursor-pointer items-center gap-3 py-2"
                  >
                    <UserX size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">차단 유저</span>
                    <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                </div>
              </div>

              <div className="border-outline-variant/40 flex flex-col gap-2 rounded-2xl border bg-white p-5">
                <h2 className="text-base font-bold text-[#1c1b1b]">고객지원</h2>
                <div className="flex flex-col">
                  <a
                    href="mailto:support@cuddlemarket.com?subject=커들마켓 1:1 문의"
                    className="text-on-surface flex items-center gap-3 py-3"
                  >
                    <Headphones size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">고객센터</span>
                    <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
                  </a>
                </div>
              </div>

              <div className="border-outline-variant/40 flex flex-col gap-2 rounded-2xl border bg-white p-5">
                <h2 className="text-base font-bold text-[#1c1b1b]">계정</h2>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={openLogoutConfirm}
                    className="text-on-surface flex cursor-pointer items-center gap-3 py-3"
                  >
                    <LogOut size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">로그아웃</span>
                    <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="text-danger-500 flex cursor-pointer items-center gap-3 py-3"
                  >
                    <UserMinus size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">탈퇴하기</span>
                    <ChevronRight size={25} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                </div>
              </div>
            </section>

            {/* 데스크탑: 기존 ProfileData */}
            <div className="hidden md:block">
              <ProfileData
                setIsWithdrawModalOpen={setIsWithdrawModalOpen}
                data={myData!}
                isMyProfile
                enableImageUpload
                summaryCounts={{
                  sales: myProductsData?.pages[0]?.total ?? 0,
                  purchases: myRequestData?.pages[0]?.total ?? 0,
                  wishlist: myFavoriteData?.pages[0]?.total ?? 0,
                }}
              />
            </div>
            <div role="tablist" aria-label="마이페이지 메뉴" className="hidden flex-col gap-1 md:flex">
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
                      'flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left font-medium transition-all',
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-semibold'
                        : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface'
                    )}
                  >
                    <Icon size={16} />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <section className="relative hidden flex-1 flex-col gap-3.5 md:flex md:gap-7">
            <AnimatePresence>
              {unblockError ? (
                <div className="absolute top-11 left-1/2 z-50 w-11/12 -translate-x-1/2 md:w-auto md:pt-8">
                  <InlineNotification type="error" onClose={() => setUnblockError(null)}>
                    {unblockError}
                  </InlineNotification>
                </div>
              ) : null}
            </AnimatePresence>
            {(effectiveNav === 'nav-sales' || effectiveNav === 'nav-purchases') &&
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

            {effectiveNav === 'nav-dash' ? (
              <MyDashboard
                myProducts={myProductsData?.pages.flatMap((page) => page.content)}
                myRequests={myRequestData?.pages.flatMap((page) => page.content)}
                myFavorites={myFavoriteData?.pages.flatMap((page) => page.content)}
              />
            ) : effectiveNav === 'nav-activity' ? (
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
      {/* 모바일 ProfileData 풀스크린 — 우→좌 슬라이드 */}
      <div
        className={cn(
          'fixed inset-0 overflow-y-auto bg-gray-100/30 transition-transform duration-300 ease-out md:hidden',
          Z_INDEX.MODAL,
          isProfileFullViewOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="프로필 자세히"
        aria-hidden={!isProfileFullViewOpen}
      >
        <div className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-2">
          <button type="button" onClick={closeMobileOverlay} aria-label="닫기" className="cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-base font-bold">프로필</span>
        </div>
        <div className="flex flex-col">
          <ProfileData
            setIsWithdrawModalOpen={setIsWithdrawModalOpen}
            data={myData!}
            isMyProfile
            enableImageUpload
            summaryCounts={{
              sales: myProductsData?.pages[0]?.total ?? 0,
              purchases: myRequestData?.pages[0]?.total ?? 0,
              wishlist: myFavoriteData?.pages[0]?.total ?? 0,
            }}
          />
          <MyDashboard
            myProducts={myProductsData?.pages.flatMap((page) => page.content)}
            myRequests={myRequestData?.pages.flatMap((page) => page.content)}
            myFavorites={myFavoriteData?.pages.flatMap((page) => page.content)}
          />
        </div>
      </div>
      {/* 모바일 마이페이지 메뉴 → 풀스크린 패널 (우→좌 슬라이드) */}
      <div
        className={cn(
          'fixed inset-0 overflow-y-auto bg-white transition-transform duration-300 ease-out md:hidden',
          Z_INDEX.MODAL,
          mobilePanelTab ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label={mobilePanelTitle || '마이페이지 상세'}
        aria-hidden={!mobilePanelTab}
      >
        <div className="sticky top-0 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4">
          <button type="button" onClick={closeMobileOverlay} aria-label="닫기" className="cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-base font-bold">{mobilePanelTitle}</span>
        </div>
        <div className="flex flex-col">
          {mobilePanelTab === 'tab-sales' || mobilePanelTab === 'tab-purchases' ? (
            <div className="p-4">
              <Tabs
                tabs={mobileTradeStatusTabs}
                activeTab={activeTradeStatus}
                onTabChange={(tabId) => setActiveTradeStatus(tabId as TransactionStatus | 'ALL')}
                ariaLabel={mobilePanelTab === 'tab-sales' ? '판매 상태 메뉴' : '구매 상태 메뉴'}
                variant="card-pill"
              />
            </div>
          ) : null}
          {mobilePanelTab === 'activity' ? (
            <MyActivityPanel />
          ) : mobilePanelTab ? (
            <MyPagePanel
              activeTabCode={mobilePanelTabCode}
              activeMyPageTab={mobilePanelTab}
              activeTradeStatus={activeTradeStatus}
              myProductsData={filteredMyProductsData}
              myProductsTotal={mobilePanelTab === 'tab-sales' ? filteredMyProductsData?.length : myProductsData?.pages[0]?.total}
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
          ) : null}
        </div>
      </div>
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
