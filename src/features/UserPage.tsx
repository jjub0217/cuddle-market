'use client'

import ProfileData from '@/components/profile/ProfileData'
import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { fetchUserData, fetchUserProductData, userUnBlocked } from '@/lib/api/profile'
import { ProductListItem } from '@/components/product/ProductListItem'
import LoadMoreButton from '@/components/commons/button/LoadMoreButton'
import EmptyState from '@/components/EmptyState'
import { Package } from 'lucide-react'
import UserReportModal from '@/components/modal/UserReportModal'
import BlockModal from '@/components/modal/BlockModal'
import { useUserStore } from '@/store/userStore'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '@/components/commons/InlineNotification'
import { ROUTES } from '@/constants/routes'

function UserPage() {
  const { user } = useUserStore()
  const params = useParams()
  const id = params.id as string
  const queryClient = useQueryClient()

  const router = useRouter()
  const [, setIsWithdrawModalOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
  const [unblockError, setUnblockError] = useState<React.ReactNode | null>(null)

  const {
    data: userData,
    isLoading: isLoadingUserData,
    error: errorUserData,
  } = useQuery({
    queryKey: ['userPage'],
    queryFn: () => fetchUserData(Number(id)),
    enabled: !!id,
    refetchOnWindowFocus: false,
  })

  const {
    data: userProductData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingUserProductData,
    error: errorUserProductData,
  } = useInfiniteQuery({
    queryKey: ['userProducts', id],
    queryFn: ({ pageParam }) => fetchUserProductData(id!, pageParam),
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
    initialPageParam: 0,
    enabled: !!id,
  })

  const isMyProfile = user?.id === userData?.id

  const { mutate: unblockUser } = useMutation({
    mutationFn: () => userUnBlocked(Number(userData?.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPage'] })
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
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
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
      <div className="pb-4xl relative bg-white pt-0 md:pt-8">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence>
            {unblockError && (
              <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 md:pt-8">
                <InlineNotification type="error" onClose={() => setUnblockError(null)}>
                  {unblockError}
                </InlineNotification>
              </div>
            )}
          </AnimatePresence>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col gap-0 md:flex-row md:gap-8">
          <ProfileData
            setIsWithdrawModalOpen={setIsWithdrawModalOpen}
            setIsReportModalOpen={setIsReportModalOpen}
            setIsBlockModalOpen={setIsBlockModalOpen}
            data={userData!}
            isMyProfile={isMyProfile}
            unblockUser={unblockUser}
          />
          <section className="flex w-full flex-col gap-6 rounded-xl border-gray-200 p-5 md:border">
            <div className="flex justify-between">
              <h4 className="flex flex-col items-start">
                <span className="font-bold">{userData?.nickname}님의 판매상품</span>
                <span>총 {totalProducts}개의 상품이 있습니다</span>
              </h4>
            </div>
            <div className="gap-lg flex max-h-[60vh] flex-col overflow-y-auto">
              {userProductData?.pages?.flatMap((page) => page.content).length ? (
                <>
                  <ul className="flex flex-col items-center justify-start gap-2.5">
                    {allProducts.map((product) => (
                      <ProductListItem key={product.id} product={product} />
                    ))}
                  </ul>
                  {hasNextPage && <LoadMoreButton onClick={() => fetchNextPage()} isLoading={isFetchingNextPage} />}
                </>
              ) : (
                <EmptyState icon={Package} title={'등록한 상품이 없습니다'} />
              )}
            </div>
          </section>
        </div>
      </div>
      <UserReportModal isOpen={isReportModalOpen} onCancel={() => setIsReportModalOpen(false)} userNickname={userData.nickname} userId={Number(id)} />
      <BlockModal isOpen={isBlockModalOpen} onCancel={() => setIsBlockModalOpen(false)} userNickname={userData.nickname} userId={Number(id)} />
    </>
  )
}

export default UserPage
