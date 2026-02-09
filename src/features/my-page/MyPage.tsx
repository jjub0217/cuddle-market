'use client'

import { useUserStore } from '@/store/userStore'
import { useEffect, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useMutation, useInfiniteQuery, useQueryClient, useQuery } from '@tanstack/react-query'
import { deleteProduct, fetchMyBlockedData, fetchMyFavoriteData, fetchMyPageData, fetchMyProductData, fetchMyRequestData } from '@/lib/api/products'
import Tabs from '@/components/Tabs'
import { MY_PAGE_TABS, type MyPageTabId } from '@/constants/constants'
import MyPagePanel from './components/MyPagePanel'
import DeleteConfirmModal from '@/components/modal/DeleteConfirmModal'
import WithdrawModal, { type WithDrawFormValues } from '@/components/modal/WithdrawModal'
import { userUnBlocked, withDraw } from '@/lib/api/profile'
import ProfileData from '@/components/profile/ProfileData'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'

function MyPage() {
  const [deleteError, setDeleteError] = useState<React.ReactNode | null>(null)

  const { user, clearAll, updateUserProfile, setRedirectUrl } = useUserStore()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const router = useRouter()
  const pathname = usePathname()
  const [unblockError, setUnblockError] = useState<React.ReactNode | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawError, setWithdrawError] = useState<React.ReactNode | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<{
    id: number
    title: string
    price: number
    mainImageUrl: string
  } | null>(null)
  const tabParam = searchParams.get('tab') as MyPageTabId | null
  const initialTab = tabParam && MY_PAGE_TABS.some((tab) => tab.id === tabParam) ? tabParam : 'tab-sales'
  const [activeMyPageTab, setActiveMyPageTab] = useState<MyPageTabId>(initialTab)
  const activeTabCode = MY_PAGE_TABS.find((tab) => tab.id === activeMyPageTab)?.code ?? 'SELL'

  const {
    data: myData,
    isLoading: isLoadingMyData,
    error: errorMyData,
  } = useQuery({
    queryKey: ['mypage', user?.id],
    queryFn: () => fetchMyPageData(),
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
    queryFn: ({ pageParam }) => fetchMyProductData(pageParam),
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
    queryFn: ({ pageParam }) => fetchMyRequestData(pageParam),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: activeMyPageTab === 'tab-purchases',
  })

  const {
    data: myFavoriteData,
    fetchNextPage: fetchNextFavorites,
    hasNextPage: hasNextFavorites,
    isFetchingNextPage: isFetchingNextFavorites,
    error: errorMyFavoritetData,
  } = useInfiniteQuery({
    queryKey: ['myFavorite', user?.id],
    queryFn: ({ pageParam }) => fetchMyFavoriteData(pageParam),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: activeMyPageTab === 'tab-wishlist',
  })

  const {
    data: myBlockedData,
    fetchNextPage: fetchNextBlocked,
    hasNextPage: hasNextBlocked,
    isFetchingNextPage: isFetchingNextBlocked,
    error: errorMyFBlockedData,
  } = useInfiniteQuery({
    queryKey: ['myBlocked', user?.id],
    queryFn: ({ pageParam }) => fetchMyBlockedData(pageParam),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: activeMyPageTab === 'tab-blocked',
  })

  const paginationProps = {
    'tab-sales': { fetchNextPage: fetchNextProducts, hasNextPage: hasNextProducts, isFetchingNextPage: isFetchingNextProducts },
    'tab-purchases': { fetchNextPage: fetchNextRequests, hasNextPage: hasNextRequests, isFetchingNextPage: isFetchingNextRequests },
    'tab-wishlist': { fetchNextPage: fetchNextFavorites, hasNextPage: hasNextFavorites, isFetchingNextPage: isFetchingNextFavorites },
    'tab-blocked': { fetchNextPage: fetchNextBlocked, hasNextPage: hasNextBlocked, isFetchingNextPage: isFetchingNextBlocked },
  }[activeMyPageTab]

  const { mutate: deleteProductMutate } = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
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

  const handleTabChange = (tabId: string) => {
    setActiveMyPageTab(tabId as MyPageTabId)
    router.replace(`?tab=${tabId}`)
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
      await withDraw(data)
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
    mutationFn: (blockedUserId: number) => userUnBlocked(blockedUserId),
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
    const currentTab = tabParam && MY_PAGE_TABS.some((tab) => tab.id === tabParam) ? tabParam : 'tab-sales'
    setActiveMyPageTab(currentTab)
  }, [tabParam])

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

  if ((isLoadingMyData && !myData) || (isLoadingMyProductData && !myProductsData)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (errorMyData || errorMyProductData || errorMyRequestData || errorMyFavoritetData || errorMyFBlockedData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col gap-4">
          <p>내 정보를 불러올 수 없습니다</p>
          <button onClick={() => router.push('/')} className="text-blue-600 hover:text-blue-800">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!user?.id) {
      setRedirectUrl(pathname)
      router.push('/auth/login')
    }
  }, [user?.id, pathname, router, setRedirectUrl])

  if (!user?.id) {
    return null
  }

  return (
    <>
      <div className="pb-4xl bg-white pt-0 md:pt-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3.5 md:flex-row md:gap-8">
          <ProfileData setIsWithdrawModalOpen={setIsWithdrawModalOpen} data={myData!} isMyProfile />
          <section className="relative flex flex-1 flex-col gap-3.5 md:gap-7">
            <AnimatePresence>
              {unblockError && (
                <div className="absolute top-11 left-1/2 z-50 w-11/12 -translate-x-1/2 md:w-auto md:pt-8">
                  <InlineNotification type="error" onClose={() => setUnblockError(null)}>
                    {unblockError}
                  </InlineNotification>
                </div>
              )}
            </AnimatePresence>
            <Tabs
              tabs={MY_PAGE_TABS}
              activeTab={activeMyPageTab}
              onTabChange={(tabId) => handleTabChange(tabId as MyPageTabId)}
              ariaLabel="마이페이지 메뉴"
            />
            <MyPagePanel
              activeTabCode={activeTabCode}
              activeMyPageTab={activeMyPageTab}
              myProductsData={myProductsData?.pages.flatMap((page) => page.content)}
              myProductsTotal={myProductsData?.pages[0]?.total}
              myRequestData={myRequestData?.pages.flatMap((page) => page.content)}
              myRequestTotal={myRequestData?.pages[0]?.total}
              myFavoriteData={myFavoriteData?.pages.flatMap((page) => page.content)}
              myFavoriteTotal={myFavoriteData?.pages[0]?.total}
              myBlockedData={myBlockedData?.pages.flatMap((page) => page.content)}
              myBlockedTotal={myBlockedData?.pages[0]?.total}
              {...paginationProps}
              handleConfirmModal={handleConfirmModal}
              unblockUser={unblockUser}
            />
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
