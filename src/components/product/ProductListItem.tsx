'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import { Badge } from '@/components/commons/badge/Badge'
import { ProductMetaItem } from './ProductMetaItem'
import { ROUTES } from '@/constants/routes'
import { formatPrice } from '@/lib/utils/formatPrice'
import { getTradeStatus } from '@/lib/utils/getTradeStatus'
import { getTradeStatusColor } from '@/lib/utils/getTradeStatusColor'
import { cn } from '@/lib/utils/cn'
import { Eye } from 'lucide-react'
import type { Product } from '@/types'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface ProductListItemProps {
  product: Product
  children?: React.ReactNode
}

export function ProductListItem({ product, children }: ProductListItemProps) {
  const { id, title, price, mainImageUrl, tradeStatus, viewCount } = product
  const tradeStatusText = getTradeStatus(tradeStatus)
  const tradeStatusColor = getTradeStatusColor(tradeStatus)
  const isMd = useMediaQuery('(min-width: 768px)')
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

  return (
    <li id={id.toString()} className="w-full">
      <Link href={ROUTES.DETAIL_ID(id)} className="flex w-full items-center justify-center gap-6 rounded-lg border border-gray-300 p-3.5">
        <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-lg md:w-[10%]">
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
          {!isMd &&
            (children
              ? children
              : tradeStatus && <Badge className={cn('absolute top-2 left-2 bg-[#48BB78] text-white', tradeStatusColor)}>{tradeStatusText}</Badge>)}
        </div>
        <div className="flex flex-1 items-start">
          <div className="flex h-fit flex-1 flex-col items-start gap-2">
            <div className="flex w-full items-start justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="md:heading-h5 line-clamp-2 w-full text-[17px] font-bold md:line-clamp-none md:w-96 md:truncate">{title}</h3>
                <span className="font-medium text-gray-500">{formatPrice(price)} 원</span>
              </div>
            </div>
            <div>
              <ProductMetaItem icon={Eye} label={`조회 ${viewCount}`} className="text-sm text-gray-400" />
            </div>
          </div>
          {isMd &&
            (children ? children : tradeStatus && <Badge className={cn('bg-[#48BB78] text-white', tradeStatusColor)}>{tradeStatusText}</Badge>)}
        </div>
      </Link>
    </li>
  )
}
