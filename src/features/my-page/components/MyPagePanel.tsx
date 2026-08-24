'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl } from '@/lib/utils/imageUrl'
import type { MyPageTabId, TransactionStatus } from '@/constants/constants'
import type { BlockedUser, Product } from '@/types'
import MyPageTitle from './MyPageTitle'
import MyList from './MyList'
import ProductCard from '@/components/product/ProductCard'
import Button from '@/components/commons/button/Button'
import InfiniteScrollSentinel from '@/components/commons/InfiniteScrollSentinel'
import SkipToLoadMoreLink from '@/components/commons/SkipToLoadMoreLink'
import EmptyState from '@/components/EmptyState'
import { Package, Heart, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { getTimeAgo } from '@cuddle/shared'

interface MyPagePanelProps {
  activeTabCode: string
  activeMyPageTab: MyPageTabId
  activeTradeStatus?: TransactionStatus | 'ALL'
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

type TradeStatusKey = TransactionStatus | 'ALL'

const TRADE_STATUS_LABEL: Record<'tab-sales' | 'tab-purchases', Partial<Record<TradeStatusKey, string>>> = {
  'tab-sales': {
    ALL: '전체',
    SELLING: '판매중',
    RESERVED: '예약중',
    COMPLETED: '판매완료',
  },
  // ⚠️ 「판매요청」 탭이라 **요청 갈래** 말을 쓴다. 공용 `getTradeLabel`(packages/shared)도
  //    REQUEST 상품에는 「요청중」·「요청완료」를 돌려준다. 「구매완료」로 되돌리지 마라 —
  //    이 탭은 내가 산 물건이 아니라 **내가 올린 판매요청 글** 목록이다.
  //    여기를 `getTradeLabel` 로 바꾸지 않는 까닭: 칩에는 `ALL: '전체'` 가 섞여 있어
  //    함수 하나로 안 덮인다.
  'tab-purchases': {
    ALL: '전체',
    SELLING: '요청중',
    COMPLETED: '요청완료',
  },
}

function BlockedUserAvatar({ profileImageUrl, nickname }: { profileImageUrl?: string; nickname: string }) {
  const [imgError, setImgError] = useState(false)

  if (!profileImageUrl) {
    return (
      <div className="bg-primary-50 heading-h4 flex h-full w-full items-center justify-center">
        {nickname.charAt(0).toUpperCase()}
      </div>
    )
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
    description: '상품',
    emptyIcon: Package,
    emptyTitle: '등록한 상품이 없습니다',
    emptyDescription: '상품을 등록해보세요',
    buttonLabel: '상품등록',
    navigateTo: '/product-post?tab=tab-sales',
  },
  'tab-purchases': {
    heading: '내가 등록한 판매요청',
    description: '상품',
    emptyIcon: Package,
    emptyTitle: '등록한 판매요청이 없습니다',
    emptyDescription: '판매요청을 등록해보세요',
    buttonLabel: '판매요청 등록',
    navigateTo: '/product-post?tab=tab-purchases',
  },
  'tab-wishlist': {
    heading: '내가 찜한 상품',
    description: '상품',
    emptyIcon: Heart,
    emptyTitle: '찜한 상품이 없습니다',
    emptyDescription: '마음에 드는 상품을 찜해보세요',
  },
}

export default function MyPagePanel({
  activeTabCode,
  activeMyPageTab,
  activeTradeStatus,
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
  const productCount = productData?.content?.length ?? 0
  const hasContent =
    (activeMyPageTab !== 'tab-blocked' && (productData?.content?.length || config)) ||
    (activeMyPageTab === 'tab-blocked' && myBlockedData?.length)

  const tradeStatusLabel =
    (activeMyPageTab === 'tab-sales' || activeMyPageTab === 'tab-purchases') && activeTradeStatus
      ? TRADE_STATUS_LABEL[activeMyPageTab][activeTradeStatus]
      : undefined
  const titleDescription = tradeStatusLabel ?? config?.description ?? ''

  // ⚠️ 좁은 폭의 좌우 여백 `px-4`(16) 는 **이 조각이 스스로 갖는다.** 지우지 말 것(#1001).
  //    좁은 폭에서는 이 조각이 모바일 패널 안에 통째로 들어가는데, 그 바깥 상자에는 여백이 없다.
  //    값 16 은 모바일 패널의 알약 자리(`p-4`)·머리글(`px-4`)과 같고 `PAGE_CONTAINER` 의 `px-4` 와도 같다(#963).
  //    **바깥에서 또 주면 32 가 된다** — 부르는 쪽은 여백을 더하지 않는다.
  return (
    <div
      role="tabpanel"
      id={`panel-${activeTabCode}`}
      aria-labelledby={activeMyPageTab}
      className={cn(
        'border-outline-variant/40 flex flex-col rounded-xl px-4 py-5 md:border md:p-5 md:px-5',
        hasContent && 'gap-4'
      )}
    >
      {config ? (
        <MyPageTitle
          heading={config.heading}
          count={productData?.total}
          description={titleDescription}
          buttonLabel={config.buttonLabel}
          navigateTo={config.navigateTo}
        />
      ) : (
        <MyPageTitle heading="차단한 사용자" description={`차단한 사용자 ${myBlockedTotal ?? 0}명`} />
      )}

      <div className="gap-lg flex flex-col">
        {activeMyPageTab !== 'tab-blocked' ? (
          productData?.content?.length ? (
            <>
              <SkipToLoadMoreLink targetId="my-page-products-load-more" hasNextPage={hasNextPage} />
              {activeMyPageTab === 'tab-wishlist' ? (
                <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {productData.content.map((product) => (
                    <li key={product.id}>
                      <ProductCard data={product} vertical />
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  className={cn(
                    // ⚠️ 좁은 폭에서는 자르지 않는다. 이 목록이 사는 모바일 전체화면 패널이
                    //    이미 통째로 스크롤된다(MyPage.tsx:810 의 `fixed inset-0 overflow-y-auto`).
                    //    그 안에 60vh 짜리 스크롤 상자를 또 두면 스크롤이 두 겹이 되고,
                    //    `scrollbar-hide` 때문에 스크롤바도 안 보여 **마지막 카드가 잘린 것처럼 보인다.**
                    //    넓은 폭(데스크탑 탭 화면)에서는 옆에 사이드바가 있어 높이 제한이 맞다.
                    //    ⚠️ 데스크탑 쪽 MyPagePanel 은 `hidden … md:flex`(MyPage.tsx:700) 안이라
                    //       좁은 폭에서는 안 그려진다 — 그래서 `md:` 로 가르면 정확히 맞는다.
                    '-m-2 overflow-visible p-2',
                    productCount > 1 && 'md:scrollbar-hide md:max-h-[60vh] md:overflow-y-auto'
                  )}
                >
                  <ul className="flex flex-col items-stretch justify-start gap-2 md:gap-2.5">
                    {productData.content.map((product) => (
                      <MyList key={product.id} {...product} activeTab={activeMyPageTab} handleConfirmModal={handleConfirmModal} />
                    ))}
                  </ul>
                </div>
              )}
              <InfiniteScrollSentinel
                id="my-page-products-load-more"
                enabled={productData.content.length > 0}
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={fetchNextPage}
              />
            </>
          ) : config ? (
            <EmptyState icon={config.emptyIcon} title={config.emptyTitle} description={config.emptyDescription} />
          ) : null
        ) : myBlockedData?.length ? (
          <>
            <SkipToLoadMoreLink targetId="my-page-blocked-load-more" hasNextPage={hasNextPage} />
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {myBlockedData.map((user) => (
                <li
                  key={user.blockedUserId}
                  className="border-outline-variant/40 flex flex-col items-center gap-3 rounded-2xl border bg-white p-4"
                >
                  <Link href={`/user-profile/${user.blockedUserId}`} className="flex w-full flex-col items-center gap-2">
                    <div className="relative aspect-square w-14 shrink-0 overflow-hidden rounded-full">
                      <BlockedUserAvatar profileImageUrl={user.profileImageUrl} nickname={user.nickname} />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="line-clamp-1 font-semibold">{user.nickname}</span>
                      <span className="text-xs text-gray-500">{getTimeAgo(user.blockedAt)} 차단</span>
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="hover:bg-surface-container-low hover:text-on-surface w-full cursor-pointer"
                    onClick={() => unblockUser?.(user.blockedUserId)}
                  >
                    차단 해제
                  </Button>
                </li>
              ))}
            </ul>
            <InfiniteScrollSentinel
              id="my-page-blocked-load-more"
              enabled={myBlockedData.length > 0}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onLoadMore={fetchNextPage}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
