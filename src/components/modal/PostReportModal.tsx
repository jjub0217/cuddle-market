import { COMMUNITY_REPORT_REASON } from '@cuddle/shared'
import ReportModalBase, { type ReportFormValues } from './ReportModalBase'
import { fetchGraphQL } from '@/lib/api/graphql'
import { isAlreadyReported } from '@/lib/api/reportErrors'
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
      await fetchGraphQL(`
        mutation ReportPost($postId: Int!, $reason: String!, $details: String) {
          reportPost(postId: $postId, reason: $reason, details: $details) { success }
        }
      `, { postId, reason: data.reasonCode, details: data.detailReason })
      onCancel()
    } catch (error) {
      const isDuplicate = isAlreadyReported(error)
      setPostReportError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">{isDuplicate ? '이미 신고한 게시글입니다.' : '게시글 신고에 실패했습니다.'}</p>
          {!isDuplicate ? <p>잠시 후 다시 시도해주세요.</p> : null}
        </div>,
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
      reasons={COMMUNITY_REPORT_REASON}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      error={postReportError}
      onClearError={() => setPostReportError(null)}
    />
  )
}
