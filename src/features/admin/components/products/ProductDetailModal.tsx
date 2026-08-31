'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteAdminProduct, fetchAdminProductDetail } from '@/lib/api/admin'
import {
  PRODUCT_TYPE_EN_TO_KO,
  TRADE_STATUS_EN_TO_KO,
  PRODUCT_STATUS_EN_TO_KO,
  CATEGORY_EN_TO_KO,
} from '../../configs/productTableConfig'
import DeleteConfirmDialog from '../common/DeleteConfirmDialog'

interface ProductDetailModalProps {
  isOpen: boolean
  productId: number | null
  onClose: () => void
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const MM = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}`
}

function formatPrice(price: number) {
  return `${price.toLocaleString('ko-KR')}원`
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-500">{label}</p>
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-900">{value}</div>
    </div>
  )
}

function SimpleField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}

function SimpleBadgeField({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-500">{label}</p>
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>{value}</span>
    </div>
  )
}

const TRADE_STATUS_COLORS: Record<string, string> = {
  SELLING: 'bg-[#DCFCE7] text-green-800',
  BUYING: 'bg-[#DCFCE7] text-green-800',
  RESERVED: 'bg-[#FEF9C3] text-yellow-800',
  COMPLETED: 'bg-[#F3F4F6] text-gray-800',
}

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  SELL: 'bg-[#7BA5D6] text-white',
  REQUEST: 'bg-[#FFF7ED] text-orange-800',
}

const CONDITION_COLORS: Record<string, string> = {
  NEW: 'bg-[#DCFCE7] text-green-800',
  LIKE_NEW: 'bg-[#DBEAFE] text-blue-800',
  USED: 'bg-[#FEF9C3] text-yellow-800',
  NEED_REPAIR: 'bg-[#FEE2E2] text-red-800',
}

export default function ProductDetailModal({ isOpen, productId, onClose }: ProductDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product-detail', productId],
    queryFn: () => fetchAdminProductDetail(productId!),
    enabled: isOpen && productId !== null,
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && productId && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen, productId])

  const handleClose = () => {
    setShowDeleteConfirm(false)
    onClose()
  }

  const handleDelete = async () => {
    if (productId === null || isDeleting) return

    setIsDeleting(true)
    try {
      await deleteAdminProduct(productId)

      // 목록은 ['admin-products', 조회조건] 으로 캐시된다(useAdminTable).
      // 조회조건까지 맞출 수 없으니 앞부분만 맞으면 잡는 invalidateQueries 를 쓴다.
      await queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      // 지운 상품의 상세는 다시 열 일이 없다. 남겨두면 낡은 값이 잠깐 보인다.
      queryClient.removeQueries({ queryKey: ['admin-product-detail', productId] })

      alert('상품이 삭제되었습니다.')
      setShowDeleteConfirm(false)
      dialogRef.current?.close()
    } catch {
      // 조용히 닫으면 「지워진 줄 알았는데 그대로」가 된다. 반드시 알린다.
      alert('상품 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-225 flex-col rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-900/70 open:flex"
      onClick={(e) => {
        // 삭제 중에는 바깥을 눌러도 안 닫는다 — 닫히면 결과를 못 알린다
        if (e.target === dialogRef.current && !isDeleting) dialogRef.current.close()
      }}
      onClose={handleClose}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500">로딩 중...</p>
        </div>
      ) : null}
      {product ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">상품 상세 정보</h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            <div className="flex gap-6">
              {/* Left Column: image + basic info */}
              <div className="flex w-1/2 shrink-0 flex-col">
                {/* Main image */}
                <div className="mb-2 flex h-65 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.mainImageUrl} alt={product.title} className="h-full w-full object-cover" />
                </div>

                {/* Sub images */}
                <div className="mb-5 flex gap-2">
                  {Array.from({ length: 4 }, (_, idx) => {
                    const src = product.subImageUrls?.[idx]
                    return (
                      <div
                        key={idx}
                        className="flex h-15 w-15 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                      >
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={src} alt={`서브이미지 ${idx + 1}`} className="h-full w-full object-cover" />
                        ) : (
                          <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                            />
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Left info fields */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <Field label="상품 ID" value={String(product.id)} />
                  <Field label="판매자" value={product.sellerInfo?.sellerNickname ?? '-'} />
                </div>
                <div className="mt-4">
                  <Field label="상품명" value={product.title} />
                </div>
                <div className="mt-4">
                  <Field label="지역" value={`${product.addressSido} ${product.addressGugun}`} />
                </div>
              </div>

              {/* Right Column: description + detail grid */}
              <div className="flex w-1/2 flex-col">
                {/* 상품 설명 */}
                <div className="mb-5">
                  <p className="mb-1.5 text-sm font-medium text-gray-500">상품 설명</p>
                  <div className="max-h-50 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm leading-relaxed text-gray-900">
                    {product.description || '-'}
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                  <SimpleBadgeField
                    label="거래 상태"
                    value={TRADE_STATUS_EN_TO_KO[product.tradeStatus ?? ''] ?? product.tradeStatus ?? '-'}
                    color={TRADE_STATUS_COLORS[product.tradeStatus ?? ''] ?? 'bg-gray-100 text-gray-800'}
                  />
                  <SimpleBadgeField
                    label="상품 상태"
                    value={PRODUCT_STATUS_EN_TO_KO[product.productStatus] ?? product.productStatus}
                    color={CONDITION_COLORS[product.productStatus] ?? 'bg-gray-100 text-gray-800'}
                  />
                  <SimpleBadgeField
                    label="유형"
                    value={PRODUCT_TYPE_EN_TO_KO[product.productType] ?? product.productType}
                    color={PRODUCT_TYPE_COLORS[product.productType] ?? 'bg-gray-100 text-gray-800'}
                  />
                  <SimpleField label="카테고리" value={CATEGORY_EN_TO_KO[product.category] ?? product.category ?? '-'} />
                  <SimpleField label="가격" value={formatPrice(product.price)} />
                  <SimpleField label="조회수" value={String(product.viewCount ?? 0)} />
                  <SimpleField label="찜 수" value={String(product.favoriteCount)} />
                  <SimpleField label="작성일시" value={formatDateTime(product.createdAt)} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              삭제
            </button>
          </div>

          <DeleteConfirmDialog
            isOpen={showDeleteConfirm}
            title="상품 삭제 확인"
            description="삭제 시 해당 상품과 관련된 모든 데이터가 즉시 삭제되며 되돌릴 수 없습니다."
            isPending={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => {
              if (isDeleting) return
              setShowDeleteConfirm(false)
            }}
          />
        </>
      ) : null}
    </dialog>
  )
}
