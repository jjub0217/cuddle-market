'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { MockProduct } from '../../mocks/mockProducts'

interface ProductDetailModalProps {
  isOpen: boolean
  product: MockProduct | null
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

/** Bordered field (left column) */
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-500">{label}</p>
      <div className="rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-900">
        {value}
      </div>
    </div>
  )
}

/** Plain label + value (right column) */
function SimpleField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  )
}

/** Plain label + badge (right column) */
function SimpleBadgeField({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-500">{label}</p>
      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${color}`}>
        {value}
      </span>
    </div>
  )
}

const TRADE_STATUS_COLORS: Record<string, string> = {
  요청중: 'bg-[#DCFCE7] text-green-800',
  요청완료: 'bg-[#F3F4F6] text-gray-800',
  판매중: 'bg-[#DCFCE7] text-green-800',
  예약중: 'bg-[#FEF9C3] text-yellow-800',
  판매완료: 'bg-[#F3F4F6] text-gray-800',
}

const PRODUCT_TYPE_COLORS: Record<string, string> = {
  팝니다: 'bg-[#7BA5D6] text-white',
  삽니다: 'bg-[#FFF7ED] text-orange-800',
}

const CONDITION_COLORS: Record<string, string> = {
  '새 상품': 'bg-[#DCFCE7] text-green-800',
  '거의 새것': 'bg-[#DBEAFE] text-blue-800',
  '사용감 있음': 'bg-[#FEF9C3] text-yellow-800',
  '수리 필요': 'bg-[#FEE2E2] text-red-800',
}

function DeleteConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const confirmRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = confirmRef.current
    if (isOpen && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={confirmRef}
      className="m-auto w-full max-w-fit open:flex flex-col gap-4 rounded-xl bg-white p-6 shadow-2xl backdrop:bg-gray-900/50"
      onClick={(e) => {
        if (e.target === confirmRef.current) onCancel()
      }}
      onClose={(e) => {
        e.stopPropagation()
        onCancel()
      }}
    >
      <h4 className="text-lg font-semibold text-gray-900">상품 삭제 확인</h4>
      <p className="text-sm leading-relaxed text-gray-500">
        삭제 시 해당 상품과 관련된 모든 데이터가 즉시 삭제되며 되돌릴 수 없습니다.
      </p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          삭제
        </button>
      </div>
    </dialog>
  )
}

export default function ProductDetailModal({ isOpen, product, onClose }: ProductDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && product && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen, product])

  const handleClose = () => {
    setShowDeleteConfirm(false)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-[900px] open:flex flex-col rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-900/70"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={handleClose}
    >
      {product && (
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
                <div className="mb-2 flex h-[260px] w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Sub images */}
                <div className="mb-5 flex gap-2">
                  {(product.subImages?.length > 0 ? product.subImages : [null, null, null, null]).map(
                    (src, idx) => (
                      <div
                        key={idx}
                        className="flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={`서브이미지 ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <svg className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                          </svg>
                        )}
                      </div>
                    ),
                  )}
                </div>

                {/* Left info fields */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <Field label="상품 ID" value={String(product.id)} />
                  <Field label="닉네임" value={product.nickname} />
                </div>
                <div className="mt-4">
                  <Field label="상품명" value={product.name} />
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
                  <div className="max-h-[200px] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm leading-relaxed text-gray-900">
                    {product.description}
                  </div>
                </div>

                {/* Detail grid */}
                <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                  <SimpleBadgeField
                    label="거래 상태"
                    value={product.tradeStatus}
                    color={TRADE_STATUS_COLORS[product.tradeStatus] ?? 'bg-gray-100 text-gray-800'}
                  />
                  <SimpleBadgeField
                    label="상품 상태"
                    value={product.condition}
                    color={CONDITION_COLORS[product.condition] ?? 'bg-gray-100 text-gray-800'}
                  />
                  <SimpleBadgeField
                    label="유형"
                    value={product.productType}
                    color={PRODUCT_TYPE_COLORS[product.productType] ?? 'bg-gray-100 text-gray-800'}
                  />
                  <SimpleField label="가격" value={formatPrice(product.price)} />
                  <SimpleField label="조회수" value={String(product.viewCount)} />
                  <SimpleField label="찜 갯수" value={String(product.likeCount)} />
                  <SimpleField label="작성일시" value={formatDateTime(product.createdAt)} />
                  <SimpleField label="수정일시" value={formatDateTime(product.updatedAt)} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              삭제
            </button>
          </div>

          <DeleteConfirmDialog
            isOpen={showDeleteConfirm}
            onConfirm={() => {
              setShowDeleteConfirm(false)
              dialogRef.current?.close()
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </>
      )}
    </dialog>
  )
}
