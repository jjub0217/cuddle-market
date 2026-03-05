'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import type { MockCommunityReport } from '../../mocks/mockCommunityReports'
import { formatDate } from '../common/formatDate'
import Field from '../common/Field'
import DeleteConfirmDialog from '../common/DeleteConfirmDialog'

interface CommunityReportDetailModalProps {
  isOpen: boolean
  report: MockCommunityReport | null
  onClose: () => void
}

export default function CommunityReportDetailModal({
  isOpen,
  report,
  onClose,
}: CommunityReportDetailModalProps) {
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
      className="m-auto w-full max-w-[680px] open:flex flex-col rounded-xl bg-white p-0 shadow-xl backdrop:bg-gray-900/70"
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current.close()
      }}
      onClose={handleClose}
    >
      {report && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">커뮤니티 게시글 신고 정보</h3>
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
              {/* Row 1 */}
              <Field label="신고 ID" value={String(report.id)} />
              <Field label="신고자 닉네임" value={report.reporterNickname} />
              {/* Row 2 */}
              <Field label="작성자 닉네임" value={report.authorNickname} />
              <Field label="신고항목" value={report.reasonCode} />
              {/* Row 3 */}
              <Field label="신고 일자" value={formatDate(report.createdAt)} />
              <Field label="게시글 유형" value={report.boardType} />
              {/* Row 4 */}
              <div className="col-span-2">
                <Field label="게시글 제목" value={report.postTitle} />
              </div>
              {/* Row 5: 게시글 내용 */}
              <div className="col-span-2">
                <p className="mb-1.5 text-sm font-medium text-gray-500">게시글 내용</p>
                <div className="max-h-[120px] overflow-y-auto whitespace-pre-line rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm leading-relaxed text-gray-900">
                  {report.postContent}
                </div>
              </div>
              {/* Row 6: 신고 상세 사유 */}
              {report.detailReason && (
                <div className="col-span-2">
                  <p className="mb-1.5 text-sm font-medium text-gray-500">신고 상세 사유</p>
                  <div className="max-h-[120px] overflow-y-auto whitespace-pre-line rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm leading-relaxed text-gray-900">
                    {report.detailReason}
                  </div>
                </div>
              )}
            </div>

            {/* 첨부 이미지 */}
            <div className="mt-4">
              <p className="mb-1.5 text-sm font-medium text-gray-500">첨부 이미지</p>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }, (_, idx) => {
                  const src = report.images?.[idx]
                  return src ? (
                    <img
                      key={idx}
                      src={src}
                      alt={`첨부 이미지 ${idx + 1}`}
                      className="aspect-square w-full rounded-lg object-cover border border-gray-200"
                    />
                  ) : (
                    <div
                      key={idx}
                      className="flex aspect-square w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50"
                    >
                      <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                    </div>
                  )
                })}
              </div>
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
              className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              삭제
            </button>
          </div>

          <DeleteConfirmDialog
            isOpen={showDeleteConfirm}
            title="게시글 삭제 확인"
            description="삭제 시 해당 게시글과 관련된 모든 데이터가 즉시 삭제되며 되돌릴 수 없습니다."
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
