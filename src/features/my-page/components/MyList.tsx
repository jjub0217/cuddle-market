'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EllipsisVertical, SquarePen, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import Badge from '@/components/commons/badge/Badge'
import SelectDropdown from '@/components/commons/select/SelectDropdown'
import { STATUS_EN_TO_KO, type TransactionStatus, type MyPageTabId } from '@/constants/constants'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/utils/formatPrice'
import Button from '@/components/commons/button/Button'
import { ProductMetaItem } from '@/components/product/ProductMetaItem'
import { getTradeStatus } from '@/lib/utils/getTradeStatus'
import { getTradeStatusColor } from '@/lib/utils/getTradeStatusColor'
import { cn } from '@/lib/utils/cn'
import { patchProductTradeStatus, addFavorite } from '@/lib/api/products'
import { ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import IconButton from '@/components/commons/button/IconButton'
import { Z_INDEX } from '@/constants/ui'
import { useOutsideClick } from '@/hooks/useOutsideClick'

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

export default function MyList({ id, title, price, mainImageUrl, tradeStatus, viewCount, activeTab, handleConfirmModal }: MyListProps) {
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
  const modalRef = useRef<HTMLDivElement>(null)
  useOutsideClick(isMoreMenuOpen, [modalRef], () => setIsMoreMenuOpen(false))

  const isMd = useMediaQuery('(min-width: 768px)')
  const queryClient = useQueryClient()
  const { mutate } = useMutation({
    mutationFn: (newStatus: TransactionStatus) => patchProductTradeStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRequest'] })
      queryClient.invalidateQueries({ queryKey: ['myProducts'] })
    },
  })

  const { mutate: cancelFavorite } = useMutation({
    mutationFn: () => addFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFavorite'] })
    },
  })

  const handleProductType = (value: string) => {
    const koToEn = STATUS_EN_TO_KO.find((status) => status.name === value)?.value
    setCurrentTradeStatus(koToEn as TransactionStatus)
    mutate(koToEn as TransactionStatus)
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
  const baseTradeStatus = getTradeStatus(currentTradeStatus)
  const trade_status = activeTab === 'tab-purchases' && baseTradeStatus === '판매완료' ? '구매완료' : baseTradeStatus
  const productTradeColor = getTradeStatusColor(currentTradeStatus)

  const isCompleted = currentTradeStatus === 'COMPLETED'
  const isSalesTab = activeTab === 'tab-sales'
  const isPurchasesTab = activeTab === 'tab-purchases'
  const isWishlistTab = activeTab === 'tab-wishlist'
  const isMyProductTab = isSalesTab || isPurchasesTab

  const handleCancelFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    cancelFavorite()
  }
  const handleMoreToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMoreMenuOpen(!isMoreMenuOpen)
  }
  return (
    <li id={id.toString()} className="w-full pt-5 pb-5 md:p-0">
      <Link
        href={ROUTES.DETAIL_ID(id)}
        className="flex w-full items-start justify-center gap-3 rounded-lg border-gray-300 md:items-center md:justify-between md:gap-6 md:border md:p-3.5"
      >
        <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-lg">
          <Image
            src={getImageSrc()}
            loader={imgError || usePlaceholder || !mainImageUrl ? undefined : imageLoader}
            sizes={IMAGE_SIZES.smallThumbnail}
            alt={title}
            fill
            className="object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
            onError={handleImageError}
            unoptimized={imgError || usePlaceholder || !mainImageUrl}
          />
          {!isMd && trade_status && <Badge className={cn('absolute top-2 left-2 bg-[#48BB78] text-white', productTradeColor)}>{trade_status}</Badge>}
        </div>
        <div className="flex flex-1 items-start">
          <div className="flex h-fit flex-1 flex-col items-start gap-2">
            {isMd && trade_status && <Badge className={cn('bg-[#48BB78] text-white', productTradeColor)}>{trade_status}</Badge>}
            <div className="flex w-full items-start justify-between">
              <div className="flex w-full flex-col gap-1">
                {isMd && <h3 className="heading-h5 line-clamp-2 w-96 truncate">{title}</h3>}
                {!isMd && (
                  <div className="relative flex w-full items-start justify-between gap-2">
                    <h3 className="line-clamp-2 w-full text-[17px] font-bold">{title}</h3>
                    <IconButton size="sm" onClick={handleMoreToggle} aria-label="상품 옵션 메뉴 열기">
                      <EllipsisVertical size={16} className="text-gray-500" />
                    </IconButton>
                    {isMoreMenuOpen && (
                      <div
                        className={cn(
                          'absolute top-7 right-0 flex w-fit flex-col items-end rounded-lg border border-gray-300 bg-white',
                          Z_INDEX.DROPDOWN
                        )}
                        ref={modalRef}
                      >
                        {isMyProductTab && !isCompleted && (
                          <Button
                            size="sm"
                            className="hover:bg-primary-300 w-fit cursor-pointer gap-3 rounded-none border-b border-gray-300 hover:font-bold hover:text-white"
                            onClick={handleProductUpdate}
                          >
                            <SquarePen size={16} />
                            <span>수정</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="text-danger-500 hover:bg-primary-300 w-fit cursor-pointer gap-3 rounded-none hover:font-bold hover:text-white"
                          onClick={
                            isWishlistTab ? handleCancelFavorite : (e: React.MouseEvent) => handleConfirmModal(e, id, title, price, mainImageUrl)
                          }
                        >
                          <Trash2 size={16} />
                          <span>삭제</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                <span className="font-bold text-gray-500 md:font-medium">{formatPrice(price)} 원</span>
                {!isMd && !isCompleted && isSalesTab && <StatusDropdown className="w-full" value={currentTradeStatusKo} onChange={handleProductType} />}
                {!isMd && !isCompleted && isPurchasesTab && (
                  <Button
                    size="sm"
                    className="h-fit w-32 flex-1 cursor-pointer border border-gray-300 hover:bg-gray-300"
                    onClick={productTradeStatusCompleted}
                  >
                    구매완료
                  </Button>
                )}
              </div>
            </div>
            <ProductMetaItem icon={Eye} label={`조회 ${viewCount}`} className="text-sm text-gray-400" />
          </div>
          <div className="flex flex-col items-end gap-2">
            {isMd && !isCompleted && isSalesTab && <StatusDropdown className="w-32" value={currentTradeStatusKo} onChange={handleProductType} />}
            {isMd && !isCompleted && isPurchasesTab && (
              <Button
                size="sm"
                className="h-fit w-32 flex-1 cursor-pointer border border-gray-300 hover:bg-gray-300"
                onClick={productTradeStatusCompleted}
              >
                구매완료
              </Button>
            )}
            {isMd && (
              <div className="flex w-full min-w-32 gap-1">
                {isMyProductTab && !isCompleted && (
                  <Button
                    size="sm"
                    className="hover:bg-primary-300 flex-1 cursor-pointer border border-gray-300 hover:font-bold hover:text-white"
                    onClick={handleProductUpdate}
                  >
                    수정
                  </Button>
                )}
                <Button
                  size="sm"
                  className="hover:bg-primary-300 flex-1 cursor-pointer border border-gray-300 hover:font-bold hover:text-white"
                  onClick={isWishlistTab ? handleCancelFavorite : (e: React.MouseEvent) => handleConfirmModal(e, id, title, price, mainImageUrl)}
                >
                  {isWishlistTab ? '찜 취소' : '삭제'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Link>
    </li>
  )
}
