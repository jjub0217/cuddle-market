import { getImageSrcSet, IMAGE_SIZES, toResizedWebpUrl, PLACEHOLDER_IMAGES, PLACEHOLDER_SRCSET } from '@/lib/utils/imageUrl'
import { formatPrice } from '@/lib/utils/formatPrice'
import Button from '../commons/button/Button'
import AlertBox from './AlertBox'
import { PRODUCT_DELETE_ALERT_LIST } from '@/constants/constants'
import ModalTitle from './ModalTitle'
import { useEffect, useRef } from 'react'
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

export default function DeleteConfirmModal({ isOpen, product, onConfirm, onCancel, error, onClearError }: DeleteConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && product && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen, product])

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-11/12 open:flex flex-col gap-4 rounded-lg bg-white p-5 backdrop:bg-gray-900/70 md:w-[16vw] md:min-w-96"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={onCancel}
    >
      {product && (
        <>
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
              <div className="aspect-square w-16 shrink-0 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.mainImageUrl ? toResizedWebpUrl(product.mainImageUrl, 150) : PLACEHOLDER_IMAGES[150]}
                  srcSet={product.mainImageUrl ? getImageSrcSet(product.mainImageUrl) : PLACEHOLDER_SRCSET}
                  sizes={IMAGE_SIZES.tinyThumbnail}
                  alt={product.title}
                  onError={(e) => {
                    const img = e.currentTarget
                    if (product.mainImageUrl && img.src !== product.mainImageUrl) {
                      img.srcset = ''
                      img.src = product.mainImageUrl
                    } else {
                      img.srcset = PLACEHOLDER_SRCSET
                      img.src = PLACEHOLDER_IMAGES[150]
                    }
                  }}
                  className="h-full w-full object-cover"
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
            <Button onClick={() => dialogRef.current?.close()} size="sm" className="cursor-pointer rounded-lg border border-gray-300 bg-white">
              취소
            </Button>
            <Button onClick={() => onConfirm(product.id)} size="sm" className="bg-danger-600 cursor-pointer rounded-lg text-white">
              삭제하기
            </Button>
          </div>
        </>
      )}
    </dialog>
  )
}
