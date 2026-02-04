'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { IMAGE_SIZES, imageLoader, toResizedWebpUrl, PLACEHOLDER_IMAGES } from '@/lib/utils/imageUrl'
import { formatPrice } from '@/lib/utils/formatPrice'
import { Button } from '../commons/button/Button'
import AlertBox from './AlertBox'
import { PRODUCT_DELETE_ALERT_LIST } from '@/constants/constants'
import ModalTitle from './ModalTitle'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { Z_INDEX } from '@/constants/ui'
import { AnimatePresence } from 'framer-motion'
import InlineNotification from '../commons/InlineNotification'

interface DeleteConfirmModalProps {
  isOpen: boolean
  product: { id: number; title: string; price: number; mainImageUrl: string } | null
  onConfirm: (id: number) => void
  onCancel: () => void
  error?: React.ReactNode
  onClearError?: () => void
}

function DeleteConfirmModal({ isOpen, product, onConfirm, onCancel, error, onClearError }: DeleteConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [imgError, setImgError] = useState(false)
  const [usePlaceholder, setUsePlaceholder] = useState(false)

  // 바깥 클릭 시 onCancel 호출
  useOutsideClick(isOpen, [modalRef], onCancel)

  const handleImageError = () => {
    if (!imgError && product?.mainImageUrl) {
      setImgError(true)
    } else {
      setUsePlaceholder(true)
    }
  }

  const getImageSrc = () => {
    if (usePlaceholder || !product?.mainImageUrl) return PLACEHOLDER_IMAGES[150]
    if (imgError) return product.mainImageUrl
    return toResizedWebpUrl(product.mainImageUrl, 150)
  }

  if (!isOpen || !product) return null

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-gray-900/70 ${Z_INDEX.MODAL}`}>
      <div className="flex w-11/12 flex-col gap-4 rounded-lg bg-white p-5 md:w-[16vw] md:min-w-96" ref={modalRef}>
        <ModalTitle heading="상품 삭제" description="정말로 이 상품을 삭제하시겠습니까?" />
        <AnimatePresence>
          {error && (
            <InlineNotification type="error" onClose={() => onClearError?.()}>
              {error}
            </InlineNotification>
          )}
        </AnimatePresence>
        <AlertBox alertList={PRODUCT_DELETE_ALERT_LIST} />
        <ul>
          <li className="flex gap-2.5 rounded-lg border border-gray-300 bg-gray-100/30 p-2.5">
            <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={getImageSrc()}
                loader={imgError || usePlaceholder || !product.mainImageUrl ? undefined : imageLoader}
                sizes={IMAGE_SIZES.tinyThumbnail}
                alt={product.title}
                fill
                className="object-cover"
                onError={handleImageError}
                unoptimized={imgError || usePlaceholder || !product.mainImageUrl}
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="line-clamp-2 w-full font-medium md:line-clamp-none md:w-72 md:truncate">{product.title}</p>
              <p className="font-medium">
                <span>{formatPrice(Number(product.price))}</span>원
              </p>
            </div>
          </li>
        </ul>

        <div className="flex justify-end gap-3">
          <Button onClick={onCancel} size="sm" className="cursor-pointer rounded-lg border border-gray-300 bg-white">
            취소
          </Button>
          <Button onClick={() => onConfirm(product.id)} size="sm" className="bg-danger-600 cursor-pointer rounded-lg text-white">
            삭제하기
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmModal
