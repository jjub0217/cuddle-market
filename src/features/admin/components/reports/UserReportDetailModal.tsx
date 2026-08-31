'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import type { AdminReport } from '../../types/adminApi'
import { formatDate } from '../common/formatDate'
import Field from '../common/Field'
import { USER_REPORT_REASON_EN_TO_KO } from '../../configs/userReportTableConfig'

interface UserReportDetailModalProps {
  isOpen: boolean
  report: AdminReport | null
  onClose: () => void
}

export default function UserReportDetailModal({ isOpen, report, onClose }: UserReportDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && report && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen, report])

  const handleClose = () => {
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
            {/* ⚠️ **아직 못 누른다 — 서버에 정지 기능이 없다**(#1107).
                `suspend` · `정지` · `BANNED` · `SUSPENDED` 를 백엔드 전체에서 찾아도
                필드도 API 도 없다. 필드·API·로그인 차단·되돌리기까지 새로 설계해야 한다.

                ⚠️ **그전까지 단추를 살려 두면 안 된다.** 예전에는 눌리기는 하는데
                   「정지 시 즉시 정지되며 되돌릴 수 없습니다」라고 경고까지 하고
                   **창만 닫았다.** 관리자는 정지시킨 줄 알고 넘어간다 —
                   같은 종류의 거짓말을 신고 모달 셋에서 방금 걷어냈다(#1106). */}
            <button
              type="button"
              disabled
              title="서버 기능 준비 중입니다"
              className="cursor-not-allowed rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white opacity-50"
            >
              정지 (준비 중)
            </button>
          </div>
        </>
      ) : null}
    </dialog>
  )
}
