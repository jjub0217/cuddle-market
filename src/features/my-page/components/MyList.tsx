'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EllipsisVertical } from 'lucide-react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import SelectDropdown from '@/components/commons/select/SelectDropdown'
import { STATUS_EN_TO_KO, type TransactionStatus, type MyPageTabId } from '@/constants/constants'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/utils/formatPrice'
import Button from '@/components/commons/button/Button'
import { ProductMetaItem } from '@/components/product/ProductMetaItem'
import { cn } from '@/lib/utils/cn'
import { api } from '@/lib/api/api'
import { ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import IconButton from '@/components/commons/button/IconButton'
import { DropdownMenu, DropdownMenuItem } from '@/components/commons/DropdownMenu'
import { getTradeLabel } from '@cuddle/shared'

interface StatusDropdownProps {
  className?: string
  value: string
  onChange: (value: string) => void
}

function StatusDropdown({ className, value, onChange }: StatusDropdownProps) {
  return (
    <div className={className} onClick={(e) => e.preventDefault()}>
      <SelectDropdown
        value={value}
        onChange={onChange}
        options={STATUS_EN_TO_KO.map((sort) => ({
          value: sort.name,
          label: sort.name,
        }))}
        buttonClassName="border-0 bg-primary-50 text-gray-900 px-3 py-2"
      />
    </div>
  )
}

type MyListProps = Product & {
  activeTab?: MyPageTabId
  handleConfirmModal: (e: React.MouseEvent, id: number, title: string, price: number, mainImageUrl: string) => void
}

export default function MyList({
  id,
  title,
  price,
  mainImageUrl,
  tradeStatus,
  productType,
  favoriteCount,
  viewCount,
  activeTab,
  handleConfirmModal,
}: MyListProps) {
  const [currentTradeStatus, setCurrentTradeStatus] = useState(tradeStatus)
  const currentTradeStatusKo = STATUS_EN_TO_KO.find((s) => s.value === currentTradeStatus)?.name ?? '판매중'
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
  const [imgError, setImgError] = useState(false)
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  const handleImageError = () => {
    if (!imgError && mainImageUrl) {
      setImgError(true)
    } else {
      setUsePlaceholder(true)
    }
  }

  const getImageSrc = () => {
    if (usePlaceholder || !mainImageUrl) return PLACEHOLDER_IMAGES[400]
    if (imgError) return mainImageUrl
    return toResizedWebpUrl(mainImageUrl, 400)
  }
  const router = useRouter()
  const isMd = useMediaQuery('(min-width: 768px)')
  const queryClient = useQueryClient()
  const { mutate } = useMutation({
    mutationFn: (newStatus: TransactionStatus) => api.patch(`/products/${id}/trade-status`, { tradeStatus: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRequest'] })
      queryClient.invalidateQueries({ queryKey: ['myProducts'] })
    },
  })

  const handleProductType = (value: string) => {
    const koToEn = STATUS_EN_TO_KO.find((status) => status.name === value)?.value
    setCurrentTradeStatus(koToEn as TransactionStatus)
    mutate(koToEn as TransactionStatus)
  }

  const handleChangeTradeStatus = (next: TransactionStatus) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentTradeStatus(next)
    mutate(next)
    setIsMoreMenuOpen(false)
  }

  // ⚠️ **삭제도 다른 항목처럼 메뉴를 닫는다.** 예전에는 안 닫아서, 삭제 모달 **뒤에 시트가
  //    그대로 남아** 오버레이가 세 겹으로 쌓였다. 그 상태로 ESC 를 누르면 시트와 모달이
  //    한꺼번에 닫혀 「무엇을 닫았는지」가 흐려진다(#1003).
  const handleDeleteClick = (e: React.MouseEvent) => {
    handleConfirmModal(e, id, title, price, mainImageUrl)   // 안에서 preventDefault·stopPropagation 을 한다
    setIsMoreMenuOpen(false)
  }

  const productTradeStatusCompleted = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrentTradeStatus('COMPLETED')
    mutate('COMPLETED')
  }

  const handleProductUpdate = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/products/${id}/edit`)
  }

  const isCompleted = currentTradeStatus === 'COMPLETED'
  const isReserved = currentTradeStatus === 'RESERVED'
  const isSalesTab = activeTab === 'tab-sales'
  // ⚠️ 탭 이름은 'tab-purchases' 지만 실제 탭 문구는 「판매요청」이다(constants.ts 의 MY_PAGE_TABS).
  //    「구매」로 읽으면 뱃지 문구를 잘못 고르게 되어, 여기서는 이름을 요청 쪽으로 맞춘다.
  const isRequestsTab = activeTab === 'tab-purchases'
  const isMyProductTab = isSalesTab || isRequestsTab

  // 메인 페이지 ProductThumbnail 패턴: 이미지 위 오버레이 + 라운드 흰 배지
  //
  // 문구는 공용 함수 `getTradeLabel`(원본 packages/shared)이 정한다 — 채팅방 상품 카드
  // (ChatProductCard.tsx 의 getOverlay)와 같은 방식이다. 「그릴지 말지」는 여기가 정하고
  // (SELLING 은 뱃지를 안 그린다), 「무슨 글자냐」만 공용 함수에 맡긴다.
  //
  // 탭이 아니라 상품의 `productType` 으로 가르는 까닭: 서버가 탭마다 종류를 이미 갈라서 준다.
  // 판매상품 탭은 /profile/me/products(ProductType.SELL), 판매요청 탭은
  // /profile/me/purchase-requests(ProductType.REQUEST) 다. 그러니 값을 그대로 믿으면 되고,
  // 탭으로 짐작할 이유가 없다.
  const overlayLabel = isCompleted || isReserved ? getTradeLabel(currentTradeStatus, productType) : null
  const overlayBg = isCompleted ? 'bg-black/60' : 'bg-black/40'

  const handleMoreToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMoreMenuOpen((prev) => !prev)
  }

  return (
    <li id={id.toString()} className="relative w-full hover:z-10">
      <Link
        href={ROUTES.DETAIL_ID(id, title)}
        className="group flex w-full items-stretch gap-3 rounded-xl border border-black/5 bg-white p-3 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl md:gap-4 md:p-4"
      >
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg md:w-32">
          <Image
            src={getImageSrc()}
            loader={imgError || usePlaceholder || !mainImageUrl ? undefined : imageLoader}
            sizes={IMAGE_SIZES.smallThumbnail}
            alt={title}
            fill
            className={cn(
              'object-cover transition-all duration-300 ease-in-out group-hover:scale-105',
              isCompleted && 'opacity-80 grayscale-[0.5]'
            )}
            onError={handleImageError}
            unoptimized={imgError || usePlaceholder || !mainImageUrl}
          />
          {overlayLabel ? (
            <div className={cn('absolute inset-0 z-10 flex items-center justify-center', overlayBg)}>
              <span className="rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-gray-900 shadow-md">
                {overlayLabel}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 items-stretch gap-3 md:gap-4">
          <div className="flex flex-1 flex-col justify-between gap-3 self-stretch">
            <div className="flex w-full items-start justify-between">
              <div className="flex w-full flex-col">
                {isMd ? <h3 className="line-clamp-2 w-96 text-[15px] leading-6.5">{title}</h3> : null}
                {!isMd ? (
                  <div className="relative flex w-full items-start justify-between gap-2">
                    <h3 className="line-clamp-2 w-full text-sm font-normal">{title}</h3>
                    <IconButton
                      ref={moreButtonRef}
                      size="sm"
                      onClick={handleMoreToggle}
                      aria-label="상품 옵션 메뉴 열기"
                      aria-haspopup="menu"
                      aria-expanded={isMoreMenuOpen}
                    >
                      <EllipsisVertical size={16} className="text-gray-500" />
                    </IconButton>
                    {/* 단추에 붙는 드롭다운으로 연다(#1030).
                        모바일 웹은 앱이 아니라 데스크탑 웹의 반응형이라, 「이 항목에 대한
                        할 일」은 아래에서 올라오는 시트가 아니라 드롭다운이 맞다. */}
                    <DropdownMenu
                      isOpen={isMoreMenuOpen}
                      onClose={() => setIsMoreMenuOpen(false)}
                      triggerRef={moreButtonRef}
                      label={`${title} 상품 메뉴`}
                    >
                      {/* 판매내역 — 거래 상태 변경 */}
                      {isSalesTab && !isCompleted && currentTradeStatus !== 'SELLING' ? (
                        <DropdownMenuItem onClick={handleChangeTradeStatus('SELLING')}>
                          <span>판매중으로 바꾸기</span>
                        </DropdownMenuItem>
                      ) : null}
                      {isSalesTab && !isCompleted && currentTradeStatus !== 'RESERVED' ? (
                        <DropdownMenuItem onClick={handleChangeTradeStatus('RESERVED')}>
                          <span>예약중으로 바꾸기</span>
                        </DropdownMenuItem>
                      ) : null}
                      {isSalesTab && !isCompleted ? (
                        <DropdownMenuItem onClick={handleChangeTradeStatus('COMPLETED')}>
                          <span>판매완료로 바꾸기</span>
                        </DropdownMenuItem>
                      ) : null}

                      {/* 판매요청 탭 — 거래 완료 처리.
                          ⚠️ 「판매요청」 탭이라 **요청 갈래** 말을 쓴다. 뱃지도 위에서
                             `getTradeLabel` 이 「요청완료」를 준다. 「구매완료」로 되돌리지 마라 */}
                      {isRequestsTab && !isCompleted ? (
                        <DropdownMenuItem onClick={handleChangeTradeStatus('COMPLETED')}>
                          <span>요청완료로 바꾸기</span>
                        </DropdownMenuItem>
                      ) : null}

                      {/* 수정 */}
                      {isMyProductTab && !isCompleted ? (
                        <DropdownMenuItem onClick={handleProductUpdate}>
                          <span>수정하기</span>
                        </DropdownMenuItem>
                      ) : null}

                      {/* 삭제 */}
                      <DropdownMenuItem tone="danger" onClick={handleDeleteClick}>
                        <span>삭제</span>
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                ) : null}
                <span className="text-base font-bold text-gray-900">{formatPrice(price)} 원</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* 조회·찜은 누를 수 없는 정보라 아이콘 없이 글자로만 둔다 */}
              <ProductMetaItem label={`조회 ${viewCount ?? 0}`} className="text-sm text-gray-400" />
              <ProductMetaItem label={`찜 ${favoriteCount ?? 0}`} className="text-sm text-gray-400" />
            </div>
          </div>

          {/* 데스크탑 우측 액션 컬럼 */}
          {isMd ? (
            <div className="flex w-40 flex-col items-stretch gap-2">
              {/* ⚠️ 「판매요청」 탭이라 **요청 갈래** 말을 쓴다. 위 뱃지·⋮ 메뉴와 같은 말이다 */}
              {isRequestsTab && !isCompleted ? (
                <Button size="sm" variant="primary" className="cursor-pointer" onClick={productTradeStatusCompleted}>
                  요청완료
                </Button>
              ) : null}
              {isSalesTab && !isCompleted ? (
                <StatusDropdown className="w-full" value={currentTradeStatusKo} onChange={handleProductType} />
              ) : null}
              <div className="flex gap-1">
                {isMyProductTab && !isCompleted ? (
                  <Button size="sm" variant="secondary" className="flex-1 cursor-pointer" onClick={handleProductUpdate}>
                    수정
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  className="border-outline-variant/60 text-on-surface hover:bg-surface-container-high flex-1 cursor-pointer border transition-all"
                  onClick={(e: React.MouseEvent) => handleConfirmModal(e, id, title, price, mainImageUrl)}
                >
                  삭제
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </Link>
    </li>
  )
}
