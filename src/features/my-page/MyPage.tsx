'use client'

import { useUserStore } from '@/store/userStore'
import { useCallback, useEffect, useRef, useState } from 'react'
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
import { resolvePanel, type MyPagePanel as MyPagePanelId } from './panelParam'
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
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { OVERLAY_ABOVE_ATTR, PAGE_CONTAINER_MD, Z_INDEX } from '@/constants/ui'
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
  // 모바일 전체 화면 패널(판매내역·판매요청내역·찜·차단·활동·프로필)이 무엇인지는 **주소에 담는다.**
  //
  // 예전에는 useState + history.pushState였다. 주소를 안 바꾸고 히스토리만 밀어 넣어서
  // 「패널 안에서의 뒤로가기」는 됐지만, 상품 상세나 수정 화면으로 나갔다 돌아오면
  // state가 사라져 판매내역이 아니라 마이 대시보드가 떴다 (#819).
  //
  // 주소에 담으면 뒤로가기·앞으로가기·새로고침·링크 공유가 다 저절로 맞는다.
  // 데스크탑 탭이 이미 ?tab= 을 쓰고 있어 규칙도 같다.
  const panel = resolvePanel(searchParams.get('panel'))
  const isProfileFullViewOpen = panel === 'profile'
  const mobilePanelTab: MyPageTabId | 'activity' | null = panel === 'profile' ? null : panel

  /** 패널을 우리가 열어서 들어왔는지. 닫을 때 뒤로 갈 데가 있는지 가른다 */
  const openedHereRef = useRef(false)

  // 두 전체화면 패널에 초점을 가둔다(#981).
  //
  // ⚠️ **`isMobile` 로 한 번 더 거른다.** 이 패널들은 닫혀 있어도 DOM 에 남고
  //    (`translate-x-full` 로 옆으로 밀어 둔다) 넓은 화면에서는 `md:hidden` 으로 감춘다.
  //    그런데 패널이 열렸는지는 **주소(`?panel=`)** 로 정해진다 — 넓은 화면에서 그 주소로
  //    들어오면 「열림」인데 화면에는 없다. 그때 가두면 **안 보이는 상자에 초점이 갇혀**
  //    탭이 통째로 먹통이 된다. 그래서 좁은 화면에서만 가둔다(`md:hidden` 과 같은 경계).
  const profileFullViewRef = useFocusTrap<HTMLDivElement>(isMobile && isProfileFullViewOpen)
  const mobilePanelRef = useFocusTrap<HTMLDivElement>(isMobile && mobilePanelTab !== null)

  const openPanel = (next: MyPagePanelId) => {
    openedHereRef.current = true
    const params = new URLSearchParams(searchParams.toString())
    params.set('panel', next)
    router.push(`${pathname}?${params.toString()}`)
  }

  const openMobilePanel = (tab: MyPageTabId | 'activity') => openPanel(tab)

  /**
   * 대시보드의 「전체보기」에서 여는 길.
   *
   * ⚠️ 대시보드가 쓰는 이름(`sales`)과 패널 이름(`tab-sales`)이 **다르다.** 여기서 잇는다.
   *    예전에는 `?nav=` 링크였는데, 모바일은 `effectiveNav` 를 늘 `nav-dash` 로 덮어서
   *    **주소만 바뀌고 아무 일도 안 일어났다**(위 65줄).
   */
  const openDashboardPanel = (tab: 'sales' | 'purchases' | 'wishlist') => {
    const 패널: Record<typeof tab, MyPageTabId> = {
      sales: 'tab-sales',
      purchases: 'tab-purchases',
      wishlist: 'tab-wishlist',
    }
    openPanel(패널[tab])
  }
  const openProfileFullView = () => openPanel('profile')

  // ⚠️ `useCallback` 으로 감싼 까닭은 **ESC 훅(아래)이 이 함수를 의존성으로 받기 때문**이다(#1003).
  //    감싸지 않으면 렌더마다 새 함수가 되어 훅이 렌더마다 다시 달린다(lint 경고).
  const closeMobileOverlay = useCallback(() => {
    // 우리가 열어서 들어온 것이면 뒤로 가면 된다 — 히스토리가 늘지 않는다.
    // 주소로 바로 들어온 경우(링크 공유·새로고침)에는 뒤로 갈 데가 없으니 주소만 바꾼다.
    if (openedHereRef.current) {
      openedHereRef.current = false
      router.back()
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.delete('panel')
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }, [router, searchParams, pathname])
  const mobilePanelTitle =
    mobilePanelTab === 'tab-sales'
      ? '판매 내역'
      : mobilePanelTab === 'tab-purchases'
        ? '판매요청 내역'
        : mobilePanelTab === 'tab-wishlist'
          ? '찜한 상품'
          : mobilePanelTab === 'tab-blocked'
            ? '차단한 사용자'
            : mobilePanelTab === 'activity'
              ? '내 글'
              : ''
  const mobilePanelTabCode =
    mobilePanelTab && mobilePanelTab !== 'activity'
      ? (MY_PAGE_TABS.find((tab) => tab.id === mobilePanelTab)?.code ?? 'SELL')
      : 'SELL'
  // ⚠️ 「판매요청」 탭이라 **요청 갈래** 말을 쓴다. 공용 `getTradeLabel` 도 「요청완료」다.
  //    「구매완료」로 되돌리지 마라 — 내가 산 물건이 아니라 내가 올린 판매요청 글이다.
  const mobileTradeStatusTabs =
    mobilePanelTab === 'tab-purchases'
      ? [
          { id: 'ALL', label: '전체', code: 'ALL' },
          { id: 'SELLING', label: '요청중', code: 'SELLING' },
          { id: 'COMPLETED', label: '요청완료', code: 'COMPLETED' },
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
    queryKey: ['myProducts', user?.id, activeTradeStatus],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/profile/me/products', {
        params: {
          page: pageParam,
          size: 10,
          // 화면에서 거르면 이미 받아온 페이지에만 적용되어 뒤쪽 항목을 놓친다.
          // 서버가 거르게 맡긴다. ALL이면 파라미터를 빼서 전부 받는다.
          ...(activeTradeStatus === 'ALL' ? {} : { tradeStatus: activeTradeStatus }),
        },
      })
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
    queryKey: ['myRequest', user?.id, activeTradeStatus],
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/profile/me/purchase-requests', {
        params: {
          page: pageParam,
          size: 10,
          ...(activeTradeStatus === 'ALL' ? {} : { tradeStatus: activeTradeStatus }),
        },
      })
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
    // ⚠️ **모바일 패널도 조건에 넣는다.** `activeMyPageTab` 은 `?tab=` 에서만 오는데,
    //    좁은 폭에서는 주소가 `?panel=tab-blocked` 라 그 값이 'tab-sales' 로 떨어진다.
    //    그러면 질의가 아예 안 돌아 **넓은 폭에서는 2명인데 좁은 폭에서는 0명**이 된다
    //    (2026-08-22 에 실제로 그랬다).
    //
    //    ⚠️ 판매요청내역·찜은 `|| effectiveNav === 'nav-dash'` 라는 탈출구가 있어 좁은 폭에서도
    //       돌았다. 차단만 그것이 없어서 이 하나만 빈 화면이었다.
    //       여기에 `nav-dash` 를 붙이지 않는 까닭은 **대시보드에 차단 요약이 없기 때문**이다 —
    //       붙이면 마이페이지를 열기만 해도 안 쓰는 목록을 받아온다.
    enabled: activeMyPageTab === 'tab-blocked' || mobilePanelTab === 'tab-blocked',
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
  // ⚠️ 「판매요청」 탭이라 **요청 갈래** 말을 쓴다. 공용 `getTradeLabel` 도 「요청완료」다.
  //    「구매완료」로 되돌리지 마라 — 내가 산 물건이 아니라 내가 올린 판매요청 글이다.
  const tradeStatusTabs = isPurchasesTabActive
    ? [
        { id: 'ALL', label: '전체', code: 'ALL' },
        { id: 'SELLING', label: '요청중', code: 'SELLING' },
        { id: 'COMPLETED', label: '요청완료', code: 'COMPLETED' },
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

  // 서버가 걸러 주므로 여기서는 페이지를 이어붙이기만 한다.
  const filteredMyProductsData = myProductsData?.pages.flatMap((page) => page.content)
  const filteredMyRequestData = myRequestData?.pages.flatMap((page) => page.content)

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

  // ESC 로 전체화면 패널 닫기(#1003). 다른 오버레이 다섯 곳과 같은 본을 따른다
  // (`MobileSearchOverlay`).
  //
  // ⚠️ **초점 가둠(위 `useFocusTrap`)과 같이 `isMobile` 로 거른다.** `inert`(아래 두 패널)와는
  //    다르다 — `inert` 는 **자기 자손만** 막지만 이것은 **창 전체의 키를 듣고 주소를 바꾼다.**
  //    패널이 열렸는지는 주소(`?panel=`)로 정해지므로, 넓은 화면에서 그 주소로 들어오면
  //    `md:hidden` 이라 아무것도 안 보이는데 「열림」이다. 거르지 않으면 **상자가 보이지도 않는
  //    화면에서 ESC 가 뒤로가기를 일으킨다.**
  //
  // 두 패널은 같은 `?panel=` 하나로 갈려(위 `panel`) 동시에 열리지 못한다 — 그래서 훅 하나로 둔다.
  //
  // ⚠️ **내 위에 열린 오버레이가 있으면 ESC 는 그쪽 몫이다.** 이 패널 안에서는 오버레이가
  //    세 겹까지 쌓인다 — 패널 → 상품 메뉴 드롭다운(`⋮`) → 삭제 모달. 셋이 다 ESC 를 듣는데
  //    셋 다 반응하면 한 번 눌러서 **패널까지 닫힌다.**
  //
  //    ⚠️ 「열린 모달 이름을 나열」하는 방법으로는 못 막는다. 드롭다운의 열림 상태는
  //    `MyList` 안에 있어(`isMoreMenuOpen`) 이 파일에서 볼 수가 없다. 그래서 상태가 아니라
  //    **DOM 에 열린 것이 있는지**로 가른다 — 위에 있는 것들은 열렸을 때만 DOM 에 있다.
  //      · 모달 둘   네이티브 `<dialog>` 라 열려 있으면 `open` 이 붙는다
  //      · 상품 메뉴 드롭다운  닫히면 렌더가 `null` 이다(`DropdownMenu.tsx`) —
  //                      `body` 로 portal 되므로 패널 안이 아니라 문서 전체에서 찾는다
  //
  //    ⚠️ 드롭다운 쪽에서 `preventDefault()` 로 표시하는 방법을 쓰면 안 된다. 드롭다운이 그걸 걸면
  //       **그 위에 열린 네이티브 모달이 ESC 로 안 닫힌다.** 「드롭다운이 위에 있으면 모달은
  //       없다」고 기대면 안 된다 — 그건 드롭다운을 닫아 주는 쪽(`MyList`)의 사정일 뿐이고,
  //       여기서 보증할 수 있는 것이 아니다.
  //
  // ⚠️⚠️ **반드시 캡처 단계여야 한다(세 번째 인자 `true`).** 버블로 달면 표식을 못 본다 —
  //    드롭다운은 `document` 에 리스너를 달아 놓았고(`useOutsideClick`), **리스너 하나가 끝날 때마다 마이크로태스크가
  //    돌아** 리액트가 그 자리에서 드롭다운을 DOM 에서 떼어낸다. 그래서 버블에 닿았을 때는
  //    이미 사라진 뒤다. 2026-08-22 에 진짜 크롬으로 쟀다:
  //
  //      ① window 캡처      표식 있음
  //      ② document(시트)   표식 있음   → 여기서 닫는다
  //      ③ window 버블      표식 없음   ← 여기에 달았다가 패널까지 닫혔다
  //    ⚠️ 위는 시트였을 때의 기록이다. 2026-08-23 에 드롭다운으로 바꾼 뒤에도
  //       마커 검증으로 같은 것을 확인했다 — 표식 한 줄을 빼니 ESC 한 번에 패널까지 닫혔다.
  //
  //    ⚠️ **이 경합은 jsdom 시험으로는 못 잡는다.** `userEvent` 가 `act()` 로 감싸서
  //       리액트 갱신을 시험 끝까지 미루기 때문에, 버블에서도 표식이 남아 있는 것처럼 보인다.
  useEffect(() => {
    if (!isMobile) return
    if (!isProfileFullViewOpen && mobilePanelTab === null) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (document.querySelector(`dialog[open], [${OVERLAY_ABOVE_ATTR}]`)) return
      closeMobileOverlay()
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [isMobile, isProfileFullViewOpen, mobilePanelTab, closeMobileOverlay])

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
        <div className={cn(PAGE_CONTAINER_MD, 'flex flex-col gap-3.5 md:flex-row md:gap-8')}>
          <div className="flex flex-col gap-2 px-4 py-2 md:p-0">
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
                    <span className="text-primary-600 text-xl font-semibold">{myData?.nickname?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-base font-bold text-[#1c1b1b]">{myData?.nickname}</p>
                  <p className="text-sm text-gray-500">{`${myData?.addressSido ?? ''} ${myData?.addressGugun ?? ''}`.trim()}</p>
                  {/*
                    ⚠️ **주소 바로 밑에 둔다.** 닉네임·주소와 한 묶음이라 눈이 위에서 아래로
                       한 번에 읽힌다. 사진 아래로 떨어뜨리면 사진과 글이 따로 노는 카드가 된다.
                       프로필 전체 화면(?panel=profile)도 이 차례다.

                    ⚠️ **없어도 자리를 보여준다.** 예전에는 `introduction &&` 이라 비어 있으면
                       통째로 사라졌다 — 데스크탑에서는 보이는 소개글이 모바일 /mypage 에서만
                       안 보였다. **내 프로필에서는 그 빈 자리가 곧 쓰러 가는 길**이다.

                    공백만 있는 소개글도 「없다」로 본다 — 저장할 때 앞뒤 공백을 안 떼고
                    최소 2자만 봐서(authValidationRules.introduction) 공백 두 칸도 저장된다.
                  */}
                  <p
                    className={cn(
                      'line-clamp-1 text-sm',
                      myData?.introduction?.trim() ? 'text-gray-500' : 'text-gray-400'
                    )}
                  >
                    {myData?.introduction?.trim() || '소개글을 작성해주세요'}
                  </p>
                </div>
                <ChevronRight size={22} strokeWidth={1.5} className="text-on-surface-muted" />
              </div>
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
                    <ChevronRight size={22} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openMobilePanel('tab-purchases')}
                    className="text-on-surface flex cursor-pointer items-center gap-3 py-2"
                  >
                    <Handbag size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">판매요청 내역</span>
                    <ChevronRight size={22} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openMobilePanel('tab-wishlist')}
                    className="text-on-surface flex cursor-pointer items-center gap-3 py-2"
                  >
                    <Heart size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">찜한 상품</span>
                    <ChevronRight size={22} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                </div>
              </div>

              <div className="border-outline-variant/40 flex flex-col gap-2 rounded-2xl border bg-white p-5">
                <h2 className="text-sm font-bold text-[#1c1b1b]">내 활동</h2>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => openMobilePanel('activity')}
                    className="text-on-surface flex cursor-pointer items-center gap-3 py-2"
                  >
                    <MessageSquareText size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">내 글</span>
                    <ChevronRight size={22} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openMobilePanel('tab-blocked')}
                    className="text-on-surface flex cursor-pointer items-center gap-3 py-2"
                  >
                    <UserX size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">차단한 사용자</span>
                    <ChevronRight size={22} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                </div>
              </div>

              <div className="border-outline-variant/40 flex flex-col gap-2 rounded-2xl border bg-white p-5">
                <h2 className="text-base font-bold text-[#1c1b1b]">고객지원</h2>
                <div className="flex flex-col">
                  <a
                    href="mailto:devel.jjub@gmail.com?subject=커들마켓 1:1 문의"
                    className="text-on-surface flex items-center gap-3 py-3"
                  >
                    <Headphones size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">고객센터</span>
                    <ChevronRight size={22} strokeWidth={1.5} className="text-on-surface-muted" />
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
                    <ChevronRight size={22} strokeWidth={1.5} className="text-on-surface-muted" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="text-danger-500 flex cursor-pointer items-center gap-3 py-3"
                  >
                    <UserMinus size={20} strokeWidth={1.5} />
                    <span className="flex-1 text-left text-base">탈퇴하기</span>
                    <ChevronRight size={22} strokeWidth={1.5} className="text-on-surface-muted" />
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
              <div className="px-4 md:px-0">
                <Tabs
                  tabs={tradeStatusTabs}
                  activeTab={activeTradeStatus}
                  onTabChange={(tabId) => setActiveTradeStatus(tabId as TransactionStatus | 'ALL')}
                  ariaLabel={activeMyPageTab === 'tab-sales' ? '판매 상태 메뉴' : '판매요청 상태 메뉴'}
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
                myProductsTotal={myProductsData?.pages[0]?.total}
                myRequestData={filteredMyRequestData}
                myRequestTotal={myRequestData?.pages[0]?.total}
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
      {/* ⚠️ **닫혀 있는 동안 탭 순서에서 뺀다**(#999). 닫혀도 DOM 에 남아(오른쪽으로 밀어 둘 뿐)
          안의 「닫기」·프로필 단추가 탭 순서에 있었다 — 초점 테두리는 안 보이는데 엔터는 눌렸다.
          `aria-hidden` 은 화면낭독기에서만 감추고 **초점은 못 막으니** 둘 다 둔다.
          ⚠️ 여기는 초점 가둠(위 `useFocusTrap`)과 달리 **`isMobile` 로 거르지 않는다.**
             가둠은 초점을 **옮기는** 일이라 넓은 폭에서 잘못 걸면 탭이 먹통이 되지만,
             `inert` 는 **자기 자손만** 막는다 — 본문은 이 상자 밖(형제)이라 영향이 없다.
             게다가 넓은 폭에서는 `md:hidden` 으로 display:none 이라 어차피 초점이 안 간다. */}
      <div
        className={cn(
          'fixed inset-0 overflow-y-auto bg-gray-100/30 transition-transform duration-300 ease-out md:hidden',
          Z_INDEX.MODAL,
          isProfileFullViewOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        ref={profileFullViewRef}
        role="dialog"
        aria-modal="true"
        aria-label="프로필 자세히"
        aria-hidden={!isProfileFullViewOpen}
        inert={!isProfileFullViewOpen}
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
            onSeeAll={openDashboardPanel}
          />
        </div>
      </div>
      {/* 모바일 마이페이지 메뉴 → 풀스크린 패널 (우→좌 슬라이드) */}
      {/* ⚠️ `inert` 를 두는 까닭은 위 프로필 패널과 같다(#999). 여기도 `isMobile` 로 안 거른다. */}
      <div
        className={cn(
          'fixed inset-0 overflow-y-auto bg-white transition-transform duration-300 ease-out md:hidden',
          Z_INDEX.MODAL,
          mobilePanelTab ? 'translate-x-0' : 'translate-x-full'
        )}
        ref={mobilePanelRef}
        role="dialog"
        aria-modal="true"
        aria-label={mobilePanelTitle || '마이페이지 상세'}
        aria-hidden={!mobilePanelTab}
        inert={!mobilePanelTab}
      >
        {/* ⚠️ `Z_INDEX.HEADER`(z-30)가 **꼭 있어야 한다.** 없으면 상품 카드가 이 머리글을
            덮고 지나간다(#1045). 카드는 `relative`(MyList.tsx:156)라 z 가 auto 인데,
            **z 가 같으면 DOM 에서 뒤에 오는 것이 위에 그려진다** — 카드가 뒤라 이긴다.
            바로 아래 알약이 `z-20` 이라 멀쩡했던 것과 같은 까닭이다(#1031에서 알약만 챙겼다).
            알약(20)보다 높아야 한다 — 머리글이 늘 위층이다. */}
        <div
          className={cn(
            'sticky top-0 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4',
            Z_INDEX.HEADER
          )}
        >
          <button type="button" onClick={closeMobileOverlay} aria-label="닫기" className="cursor-pointer">
            <ArrowLeft size={20} />
          </button>
          <span className="text-base font-bold">{mobilePanelTitle}</span>
        </div>
        <div className="flex flex-col">
          {/* 알약(거래 상태 거르개)은 목록을 보다가 바꾸고 싶어지는 도구라 **스크롤에 안 밀리게 붙인다**(#1031).
              · `top-16`  바로 위 머리글이 `h-16`(64px)이다. 실측으로 알약이 y=64 에서 시작하는 것을 확인했다
              · `bg-white` 없으면 밑으로 지나가는 카드가 알약 사이로 비쳐 보인다
              · `z-20`    카드에 `hover:z-10`(MyList.tsx)이 있다. 그보다 위여야 마우스 올린 카드가 알약을 안 덮는다
              ⚠️ 높이를 정하는 방식(flex 기둥 + h-dvh)을 쓰지 않은 까닭: 주소창이 접혔다 펴질 때
                 높이가 어긋나고, 패널→조각→목록까지 `min-h-0` 사슬을 이어야 해서 잘 깨진다.
                 머리글이 이미 `sticky top-0` 으로 도는 것과 같은 방식이라 코드도 일관된다.
              ⚠️ 이 상자 전체가 `md:hidden` 이라 데스크탑에는 안 그려진다 — `md:` 분기가 따로 필요 없다. */}
          {mobilePanelTab === 'tab-sales' || mobilePanelTab === 'tab-purchases' ? (
            <div className="sticky top-16 z-20 bg-white p-4">
              <Tabs
                tabs={mobileTradeStatusTabs}
                activeTab={activeTradeStatus}
                onTabChange={(tabId) => setActiveTradeStatus(tabId as TransactionStatus | 'ALL')}
                ariaLabel={mobilePanelTab === 'tab-sales' ? '판매 상태 메뉴' : '판매요청 상태 메뉴'}
                variant="card-pill"
              />
            </div>
          ) : null}
          {/* ⚠️ **여백은 여기 바깥이 아니라 패널 조각이 스스로 준다.** 바깥에 주면 두 번 쌓여 32 가 된다(#1001).
                 `MyPagePanel`  스스로 `px-4` 를 갖고 있다 → 그대로 둔다
                 `MyActivityPanel`  아무 여백이 없어 카드가 화면 끝에 붙었다 → 여기서 `px-4` 로 감싼다
              `px-4`(16) 를 쓰는 까닭: 위 머리글·알약 자리와 같은 값이고, `PAGE_CONTAINER` 의 `px-4` 와도 같다(#963).
              `PAGE_CONTAINER_MD` 를 쓰지 않는 것은 그것이 **768 부터만** 여백을 주기 때문이다 — 여기는 좁은 폭 전용이다.
              데스크탑 쪽 `MyActivityPanel`(위 `md:flex` 자리)은 건드리지 않는다. 이 상자는 `md:hidden` 이다. */}
          {mobilePanelTab === 'activity' ? (
            <div className="px-4">
              <MyActivityPanel />
            </div>
          ) : mobilePanelTab ? (
            <MyPagePanel
              activeTabCode={mobilePanelTabCode}
              activeMyPageTab={mobilePanelTab}
              activeTradeStatus={activeTradeStatus}
              myProductsData={filteredMyProductsData}
              myProductsTotal={myProductsData?.pages[0]?.total}
              myRequestData={filteredMyRequestData}
              myRequestTotal={myRequestData?.pages[0]?.total}
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
