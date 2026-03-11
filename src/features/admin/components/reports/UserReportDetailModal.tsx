'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { AdminReport } from '../../types/adminApi'
import { formatDate } from '../common/formatDate'
import Field from '../common/Field'
import DeleteConfirmDialog from '../common/DeleteConfirmDialog'

const USER_REPORT_REASON_EN_TO_KO: Record<string, string> = {
  ABUSE_OR_HATE: '욕설/비방/혐오',
  SPAM_OR_AD: '스팸/광고',
  INAPPROPRIATE_CONTENT: '음란물/불건전',
  REPETITIVE_POST: '도배 게시물',
  SELF_HARM_OR_SUICIDE: '자해/자살 의도',
  ETC: '기타',
}

interface UserReportDetailModalProps {
  isOpen: boolean
  report: AdminReport | null
  onClose: () => void
}

export default function UserReportDetailModal({ isOpen, report, onClose }: UserReportDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-full max-w-170 flex-col rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-900/70 open:flex"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={handleClose}
    >
      {report ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">유저 신고 정보</h3>
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
              <Field label="신고 대상 ID" value={String(report.targetId)} />
              <Field label="신고항목" value={report.reasonCodes.map((c) => USER_REPORT_REASON_EN_TO_KO[c] || c).join(', ')} />
              <Field label="처리 상태" value={report.status} />
              <Field label="신고일자" value={formatDate(report.createdAt)} />
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
            {report.imageUrls && report.imageUrls.length > 0 ? (
              <div className="mt-4">
                <p className="mb-1.5 text-sm font-medium text-gray-500">첨부 이미지</p>
                <div className="grid grid-cols-3 gap-3">
                  {report.imageUrls.map((src, idx) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={idx}
                      src={src}
                      alt={`첨부 이미지 ${idx + 1}`}
                      className="aspect-square w-full rounded-lg border border-gray-200 object-cover"
                    />
                  ))}
                </div>
              </div>
            ) : null}
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
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              정지
            </button>
          </div>

          <DeleteConfirmDialog
            isOpen={showDeleteConfirm}
            title="유저 정지 확인"
            description="정지 시 해당 유저의 계정이 즉시 정지되며 되돌릴 수 없습니다."
            confirmLabel="정지"
            onConfirm={() => {
              setShowDeleteConfirm(false)
              dialogRef.current?.close()
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        </>
      ) : null}
    </dialog>
  )
}
