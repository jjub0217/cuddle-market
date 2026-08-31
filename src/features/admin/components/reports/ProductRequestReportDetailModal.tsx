'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { deleteAdminProduct } from '@/lib/api/admin'
import type { AdminReport } from '../../types/adminApi'
import { PRODUCT_REPORT_REASON_EN_TO_KO } from '../../configs/productSellReportTableConfig'
import { formatDate } from '../common/formatDate'
import Field from '../common/Field'
import DeleteConfirmDialog from '../common/DeleteConfirmDialog'

interface ProductRequestReportDetailModalProps {
  isOpen: boolean
  report: AdminReport | null
  onClose: () => void
}

export default function ProductRequestReportDetailModal({ isOpen, report, onClose }: ProductRequestReportDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && report && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen, report])

  const handleClose = () => {
    setShowDeleteConfirm(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!report || isDeleting) return

    const productId = report.targetId
    setIsDeleting(true)
    try {
      await deleteAdminProduct(productId)

      // 목록은 ['admin-product-request-reports', 조회조건] 으로 캐시된다(useAdminTable).
      // 조회조건까지 맞출 수 없으니 앞부분만 맞으면 잡는 invalidateQueries 를 쓴다.
      await queryClient.invalidateQueries({ queryKey: ['admin-product-request-reports'] })
      // 상품 관리 목록에서도 사라져야 한다.
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
      className="m-auto w-full max-w-170 flex-col rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-900/70 open:flex"
      onClick={(e) => {
        // 삭제 중에는 바깥을 눌러도 안 닫는다 — 닫히면 결과를 못 알린다
        if (e.target === dialogRef.current && !isDeleting) dialogRef.current.close()
      }}
      onClose={handleClose}
    >
      {report ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">판매요청 상품 신고 정보</h3>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="신고 ID" value={String(report.id)} />
              <Field label="신고자 ID" value={String(report.reporterId)} />
              <Field label="상품 ID" value={String(report.targetId)} />
              <Field label="신고항목" value={report.reasonCodes.map((c) => PRODUCT_REPORT_REASON_EN_TO_KO[c] || c).join(', ')} />
              <Field label="처리 상태" value={report.status} />
              <Field label="신고 일자" value={formatDate(report.createdAt)} />
              {report.detailReason ? (
                <div className="col-span-2">
                  <p className="mb-1.5 text-sm font-medium text-gray-500">신고 상세 사유</p>
                  <div className="max-h-30 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-line text-gray-900">
                    {report.detailReason}
                  </div>
                </div>
              ) : null}
            </div>

            {/* 첨부 이미지 */}
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-gray-500">첨부 이미지</p>
              {report.imageUrls && report.imageUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {report.imageUrls.map((src, idx) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={idx}
                      src={src}
                      alt={`첨부 이미지 ${idx + 1}`}
                      className="aspect-square w-full rounded-lg border border-gray-200 bg-gray-100 object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">첨부된 이미지가 없습니다.</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              닫기
            </button>
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
