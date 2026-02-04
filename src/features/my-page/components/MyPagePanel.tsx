'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import type { MyPageTabId } from '@/constants/constants'
import type { BlockedUser, Product } from '@/types'
import MyPageTitle from './MyPageTitle'
import MyList from './MyList'
import { Button } from '@/components/commons/button/Button'
import { LoadMoreButton } from '@/components/commons/button/LoadMoreButton'
import { EmptyState } from '@/components/EmptyState'
import { Package, Heart, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface MyPagePanelProps {
  activeTabCode: string
  activeMyPageTab: MyPageTabId
  myProductsData?: Product[]
  myProductsTotal?: number
  myRequestData?: Product[]
  myRequestTotal?: number
  myFavoriteData?: Product[]
  myFavoriteTotal?: number
  myBlockedData?: BlockedUser[]
  myBlockedTotal?: number
  fetchNextPage: () => void
  hasNextPage?: boolean
  isFetchingNextPage: boolean
  handleConfirmModal: (e: React.MouseEvent, id: number, title: string, price: number, mainImageUrl: string) => void
  unblockUser?: (blockedUserId: number) => void
}

// 차단된 사용자 아바타 컴포넌트
function BlockedUserAvatar({ profileImageUrl, nickname }: { profileImageUrl?: string; nickname: string }) {
  const [imgError, setImgError] = useState(false)

  if (!profileImageUrl) {
    return <div className="bg-primary-50 flex h-full w-full items-center justify-center heading-h4">{nickname.charAt(0).toUpperCase()}</div>
  }

  return (
    <Image
      src={imgError ? profileImageUrl : toResizedWebpUrl(profileImageUrl, 150)}
      loader={imgError ? undefined : imageLoader}
      sizes={IMAGE_SIZES.tinyThumbnail}
      alt={nickname}
      fill
      className="object-cover"
      onError={() => setImgError(true)}
      unoptimized={imgError}
    />
  )
}

const TAB_CONFIG: {
  [key: string]: {
    heading: string
    description: string
    emptyIcon: LucideIcon
    emptyTitle: string
    emptyDescription?: string
    buttonLabel?: string
    navigateTo?: string
  }
} = {
  'tab-sales': {
    heading: '내가 등록한 상품',
    description: '개의 상품을 등록했습니다',
    emptyIcon: Package,
    emptyTitle: '등록한 상품이 없습니다',
    emptyDescription: '상품을 등록해보세요',
    buttonLabel: '상품등록',
    navigateTo: '/product-post?tab=tab-sales',
  },
  'tab-purchases': {
    heading: '내가 등록한 상품',
    description: '개의 상품을 등록했습니다',
    emptyIcon: Package,
    emptyTitle: '등록한 구매 요청이 없습니다',
    emptyDescription: '구매 요청을 등록해보세요',
    buttonLabel: '판매요청 등록',
    navigateTo: '/product-post?tab=tab-purchases',
  },
  'tab-wishlist': {
    heading: '내가 찜한 상품',
    description: '개의 상품을 찜했습니다',
    emptyIcon: Heart,
    emptyTitle: '찜한 상품이 없습니다',
    emptyDescription: '마음에 드는 상품을 찜해보세요',
  },
}

export default function MyPagePanel({
  activeTabCode,
  activeMyPageTab,
  myProductsData,
  myProductsTotal,
  myRequestData,
  myRequestTotal,
  myFavoriteData,
  myFavoriteTotal,
  myBlockedData,
  myBlockedTotal,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  handleConfirmModal,
  unblockUser,
}: MyPagePanelProps) {
  const getProductData = () => {
    switch (activeMyPageTab) {
      case 'tab-sales':
        return { content: myProductsData, total: myProductsTotal }
      case 'tab-purchases':
        return { content: myRequestData, total: myRequestTotal }
      case 'tab-wishlist':
        return { content: myFavoriteData, total: myFavoriteTotal }
      default:
        return undefined
    }
  }

  const productData = getProductData()
  const config = activeMyPageTab !== 'tab-blocked' ? TAB_CONFIG[activeMyPageTab] : null
  const hasContent =
    (activeMyPageTab !== 'tab-blocked' && (productData?.content?.length || config)) || (activeMyPageTab === 'tab-blocked' && myBlockedData?.length)

  return (
    <div
      role="tabpanel"
      id={`panel-${activeTabCode}`}
      aria-labelledby={activeMyPageTab}
      className={cn('flex flex-col rounded-xl border-gray-200 px-5 py-7 md:border md:p-5', hasContent && 'gap-6')}
    >
      {config ? (
        <MyPageTitle
          heading={config.heading}
          count={productData?.total}
          description={config.description}
          buttonLabel={config.buttonLabel}
          navigateTo={config.navigateTo}
          buttonClassname="text-base"
        />
      ) : (
        <MyPageTitle heading="차단 유저" description={`차단한 유저 ${myBlockedTotal ?? 0}명`} />
      )}

      <div className="gap-lg scrollbar-hide flex max-h-[60vh] flex-col overflow-y-auto">
        {activeMyPageTab !== 'tab-blocked' ? (
          productData?.content?.length ? (
            <>
              <ul className="flex flex-col items-center justify-start divide-y divide-gray-200 md:gap-2.5 md:divide-y-0">
                {productData.content.map((product) => (
                  <MyList key={product.id} {...product} activeTab={activeMyPageTab} handleConfirmModal={handleConfirmModal} />
                ))}
              </ul>
              {hasNextPage && <LoadMoreButton onClick={() => fetchNextPage()} isLoading={isFetchingNextPage} />}
            </>
          ) : (
            config && <EmptyState icon={config.emptyIcon} title={config.emptyTitle} description={config.emptyDescription} />
          )
        ) : myBlockedData?.length ? (
          <>
            <ul className="flex max-h-[60vh] flex-col items-center justify-start gap-2.5">
              {myBlockedData.map((user) => (
                <li key={user.blockedUserId} className="flex w-full items-center justify-between gap-6 rounded-lg border border-gray-300 p-3.5">
                  <Link href={`/user-profile/${user.blockedUserId}`} className="flex items-center gap-4">
                    <div className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-full">
                      <BlockedUserAvatar profileImageUrl={user.profileImageUrl} nickname={user.nickname} />
                    </div>
                    <span className="font-medium">{user.nickname}</span>
                  </Link>
                  <Button size="sm" className="border border-gray-300" onClick={() => unblockUser?.(user.blockedUserId)}>
                    차단 해제
                  </Button>
                </li>
              ))}
            </ul>
            {hasNextPage && <LoadMoreButton onClick={() => fetchNextPage()} isLoading={isFetchingNextPage} />}
          </>
        ) : null}
      </div>
    </div>
  )
}
