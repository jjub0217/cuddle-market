'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { BottomSheet, BottomSheetItem } from '@/components/commons/BottomSheet'

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
  favoriteCount,
  viewCount,
  activeTab,
  handleConfirmModal,
}: MyListProps) {
  const [currentTradeStatus, setCurrentTradeStatus] = useState(tradeStatus)
  const currentTradeStatusKo = STATUS_EN_TO_KO.find((s) => s.value === currentTradeStatus)?.name ?? '판매중'
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
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
  const isPurchasesTab = activeTab === 'tab-purchases'
  const isMyProductTab = isSalesTab || isPurchasesTab

  // 메인 페이지 ProductThumbnail 패턴: 이미지 위 오버레이 + 라운드 흰 배지
  const overlayLabel = isCompleted ? (isPurchasesTab ? '구매완료' : '판매완료') : isReserved ? '예약중' : null
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
                    <IconButton size="sm" onClick={handleMoreToggle} aria-label="상품 옵션 메뉴 열기">
                      <EllipsisVertical size={16} className="text-gray-500" />
                    </IconButton>
                    {/* 좁은 폭에서는 아래에서 올라오는 시트로 연다.
                        한 손으로 닿는 자리이고, 삭제를 화면 한가운데가 아니라
                        아래로 떨어뜨려 둘 수 있다. 앱과 같은 모양이다(#793). */}
                    <BottomSheet
                      isOpen={isMoreMenuOpen}
                      onClose={() => setIsMoreMenuOpen(false)}
                      label={`${title} 상품 메뉴`}
                    >
                      {/* 판매내역 — 거래 상태 변경 */}
                      {isSalesTab && !isCompleted && currentTradeStatus !== 'SELLING' ? (
                        <BottomSheetItem onClick={handleChangeTradeStatus('SELLING')}>
                          <span>판매중으로 바꾸기</span>
                        </BottomSheetItem>
                      ) : null}
                      {isSalesTab && !isCompleted && currentTradeStatus !== 'RESERVED' ? (
                        <BottomSheetItem onClick={handleChangeTradeStatus('RESERVED')}>
                          <span>예약중으로 바꾸기</span>
                        </BottomSheetItem>
                      ) : null}
                      {isSalesTab && !isCompleted ? (
                        <BottomSheetItem onClick={handleChangeTradeStatus('COMPLETED')}>
                          <span>판매완료로 바꾸기</span>
                        </BottomSheetItem>
                      ) : null}

                      {/* 구매내역 — 구매완료 */}
                      {isPurchasesTab && !isCompleted ? (
                        <BottomSheetItem onClick={handleChangeTradeStatus('COMPLETED')}>
                          <span>구매완료로 바꾸기</span>
                        </BottomSheetItem>
                      ) : null}

                      {/* 수정 */}
                      {isMyProductTab && !isCompleted ? (
                        <BottomSheetItem onClick={handleProductUpdate}>
                          <span>수정하기</span>
                        </BottomSheetItem>
                      ) : null}

                      {/* 삭제 */}
                      <BottomSheetItem
                        tone="danger"
                        onClick={(e: React.MouseEvent) => handleConfirmModal(e, id, title, price, mainImageUrl)}
                      >
                        <span>삭제</span>
                      </BottomSheetItem>
                    </BottomSheet>
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
              {isPurchasesTab && !isCompleted ? (
                <Button size="sm" variant="primary" className="cursor-pointer" onClick={productTradeStatusCompleted}>
                  구매완료
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
