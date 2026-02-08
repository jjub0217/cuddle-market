import { userReported } from '@/lib/api/profile'
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
      await userReported(userId, { ...data })
      queryClient.invalidateQueries({ queryKey: ['userPage'] })
      onCancel()
    } catch {
      setUserReportError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">사용자 신고에 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
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
