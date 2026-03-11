import { fetchGraphQL } from '@/lib/api/graphql'
import { USER_REPORT_REASON } from '@/constants/constants'
import ReportModalBase, { type ReportFormValues } from './ReportModalBase'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface UserReportModalProps {
  isOpen: boolean
  userNickname: string
  userId: number
  onCancel: () => void
}

export default function UserReportModal({ isOpen, userNickname, userId, onCancel }: UserReportModalProps) {
  const queryClient = useQueryClient()
  const [userReportError, setUserReportError] = useState<React.ReactNode | null>(null)

  const handleSubmit = async (data: ReportFormValues) => {
    try {
      await fetchGraphQL(`
        mutation ReportUser($userId: Int!, $reasonCode: String!, $detailReason: String, $imageFiles: [String!]) {
          reportUser(userId: $userId, reasonCode: $reasonCode, detailReason: $detailReason, imageFiles: $imageFiles) { success }
        }
      `, { userId, reasonCode: data.reasonCode, detailReason: data.detailReason, imageFiles: data.imageFiles ? [data.imageFiles].flat() : [] })
      queryClient.invalidateQueries({ queryKey: ['userPage'] })
      onCancel()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const isDuplicate = message.includes('이미 신고한 사용자입니다')
      setUserReportError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">{isDuplicate ? '이미 신고한 사용자입니다.' : '사용자 신고에 실패했습니다.'}</p>
          {!isDuplicate ? <p>잠시 후 다시 시도해주세요.</p> : null}
        </div>,
      )
    }
  }

  return (
    <ReportModalBase
      isOpen={isOpen}
      heading="사용자 신고하기"
      description={`정말로 ${userNickname}를 신고하시겠습니까?`}
      reasons={USER_REPORT_REASON}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      error={userReportError}
      onClearError={() => setUserReportError(null)}
    />
  )
}
