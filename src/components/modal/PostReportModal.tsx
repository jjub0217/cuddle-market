'use client'

import { POST_REPORT_REASON } from '@/constants/constants'
import ReportModalBase, { type ReportFormValues } from './ReportModalBase'
import { postReported } from '@/lib/api/community'
import { useState } from 'react'

interface PostReportModalProps {
  isOpen: boolean
  postId: number
  authorNickname: string
  postTitle: string
  onCancel: () => void
}

export default function PostReportModal({ isOpen, postId, authorNickname, postTitle, onCancel }: PostReportModalProps) {
  const [postReportError, setPostReportError] = useState<React.ReactNode | null>(null)

  const handleSubmit = async (data: ReportFormValues) => {
    try {
      await postReported(postId, data)
      onCancel()
    } catch {
      setPostReportError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">사용자 신고에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )
    }
  }

  const description = (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-2">
        <span className="w-10 font-semibold whitespace-nowrap">작성자</span>
        <span>{authorNickname}</span>
      </p>
      <p className="flex items-center gap-2">
        <span className="w-10 font-semibold whitespace-nowrap">제목</span>
        <span>{postTitle}</span>
      </p>
    </div>
  )

  return (
    <ReportModalBase
      isOpen={isOpen}
      heading="게시글 신고하기"
      description={description}
      reasons={POST_REPORT_REASON}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      error={postReportError}
      onClearError={() => setPostReportError(null)}
    />
  )
}
