'use client'

import ProfileData from '@/components/profile/ProfileData'
import Footer from '@/components/footer/Footer'
import { useEffect, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api/api'
import ProductCard from '@/components/product/ProductCard'
import InfiniteScrollSentinel from '@/components/commons/InfiniteScrollSentinel'
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
        {/* ⭐ **목록이 스스로 구른다.** 페이지 전체가 길어지는 대신 이 줄을 화면 높이로
            묶고, 안쪽 목록 상자만 스크롤을 갖는다. 그래서 프로필 카드는 가만히 있는다.

            ⚠️ **`sticky` 로도 되지만 안 쓴다.** 2026-08-23 에 두 방식을 만들어 눈으로
               견주고 이쪽을 골랐다. sticky 는 카드가 「따라 올라가다 멈추는」 움직임이라
               목록만 구르는 이 방식이 조용하다.

            ⚠️ `min-h-screen` 을 뺐다. 높이를 정해 줘도 **`min-height` 가 이겨서**
               페이지가 그대로 길어진다. 이 줄이 빠지면 아래 넷이 다 무의미해진다.

            높이에서 빼는 값의 근거(코드에서 직접 잰 것)
              헤더      py-3 + h-12 = 72px   (main)/layout.tsx 이 `pt-18` 로 비켜 준다
              하단 탭바  h-14        = 56px   같은 곳이 `pb-14` 로 비켜 준다
            ⚠️ 탭바는 `lg:hidden` 이라 **1024 미만**에서 보인다(768 이 아니다).
               그래서 lg 이상에서는 탭바 몫 56 을 돌려받아 4.5rem 만 뺀다.
            ⚠️ **`env(safe-area-inset-bottom)` 은 일부러 안 넣었다.** 2026-08-23 에
               **진짜 아이폰으로 봤더니 안 가려졌다.** 브라우저가 아래에 제 도구막대를
               두면 웹 내용 영역이 홈 인디케이터 위에서 끝나서, 그 여백이 0 이 된다.
               「코드상 탭바가 56+여백인데 본문은 56 만 비켜 주니 덮일 것」이라는 추정이
               있었지만 **실물이 아니었다.**
               ⚠️ 도구막대가 없는 상태(홈 화면에 담은 PWA 등)는 아직 안 봤다. 거기서
                  아래가 잘린다는 말이 나오면 그때 여기에 더한다. */}
        <div
          className={cn(
            PAGE_CONTAINER_MD,
            'flex min-h-0 flex-col md:flex-row md:gap-8',
            'h-[calc(100dvh-8rem)] lg:h-[calc(100dvh-4.5rem)]'
          )}
        >
          {/* ⚠️ showJoinDate — 가입일은 중고거래에서 **신뢰 신호**다. 「3년 된 사람」과
              「어제 가입한 사람」은 거래를 결정할 때 다르게 읽힌다. 예전에는 거꾸로
              프로필 수정 화면에만 있었다(ProfileUpdate.tsx 에서 뺐다) */}
          {/* ⚠️ **붙어 있게 하는 것은 이 감싸개다.** 예전에는 ProfileData 안쪽 상자에
              `sticky top-24` 가 붙어 있었는데 **아무 데서도 안 먹었다.** 프로필 카드
              (`<aside>`)에 `h-fit` 이 있어 상자 높이가 내용 높이와 똑같고, 그러면
              **미끄러질 여백이 0** 이라 그냥 위로 사라진다.
              그래서 카드보다 한 겹 바깥에 감싸개를 두고 여기를 붙인다 — 감싸개의 기준은
              옆 상품 목록까지 품은 이 가로 줄이라 목록만큼 길다.
              `md:self-start` 가 있어야 한다. 없으면 감싸개가 줄 높이만큼 늘어나(flex 기본값)
              또 여백이 0 이 된다.
              ⚠️ 좁은 화면에는 안 붙인다(`md:`) — 거기서는 프로필이 위아래로 쌓인 띠다.
              ⚠️ ProfileData 를 고치지 않고 여기서 감싼 까닭: 그 조각은 마이페이지·프로필
                 수정도 같이 쓴다. 안쪽을 건드리면 그 화면들 움직임까지 바뀐다.
              ⚠️ 잰 것은 **이 화면이 아니라 같은 상자 짜임을 그대로 옮겨 놓은 쪽지**다
                 (2026-08-23, 진짜 크롬). 고치기 전 짜임은 카드가 화면 위 -1124 까지
                 밀려났고, 이 짜임은 1200px 를 더 내려도 117 자리에 그대로 멈춰 있었다.
                 카드 너비는 288 로 양쪽이 같아 배치는 안 바뀐다.
                 **이 화면 자체는 아직 눈으로 안 봤다.** */}
          {/* ⚠️ **여기에 `sticky` 를 붙이지 마라.** 페이지 자체가 안 구르니 붙을 것이 없다.
              예전에는 `ProfileData` 안쪽에 `sticky top-24` 가 있었는데 그 위 `<aside>` 의
              `h-fit` 때문에 **네 화면 어디에서도 안 먹었다**(#1043). 그래서 걷었다.
              ⚠️ `shrink-0` — 좁은 폭에서는 이 카드가 위에 쌓인다. 없으면 카드가 눌려
                 찌그러진다. 대신 **카드가 먹고 남은 만큼만 목록이 갖는다.** */}
          <div className="shrink-0 md:self-start">
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
          </div>
          {/* ⚠️ `min-h-0` 이 **꼭 있어야 한다.** flex 자식은 기본이 `min-height: auto` 라,
              없으면 안쪽 목록이 안 줄고 상자 밖으로 넘친다. 눈에는 「스크롤이 안 생긴다」로
              보여서 원인을 엉뚱한 데서 찾기 쉽다. */}
          <section
            className="flex w-full min-h-0 flex-col gap-1 px-4 py-5 md:gap-6 md:p-0"
            aria-labelledby="user-product-heading"
          >
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
            {/* ⭐ **여기가 스크롤 상자다.** 넓은 폭·좁은 폭 둘 다 준다.
                ⚠️ 스크롤 막대를 감추지 마라(`scrollbar-hide`). 감추면 더 있는지 몰라서
                   **「마지막 카드가 잘렸다」로 보인다** — 마이페이지 패널에서 실제로
                   그랬다(#1031). 막대가 보여야 구를 수 있다는 것을 안다. */}
            <div className="border-outline-variant/40 min-h-0 flex-1 overflow-y-auto rounded-xl py-5 md:border md:p-5">
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
                    <InfiniteScrollSentinel
                      enabled={allProducts.length > 0}
                      hasNextPage={hasNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                      onLoadMore={fetchNextPage}
                    />
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
