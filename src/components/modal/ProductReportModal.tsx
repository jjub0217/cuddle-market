import { PRODUCT_REPORT_REASON } from '@/constants/constants'
import { api } from '@/lib/api/api'
import ReportModalBase, { type ReportFormValues } from './ReportModalBase'
import { useState } from 'react'

interface ProductReportModalProps {
  isOpen: boolean
  productId: number
  productTitle: string
  onCancel: () => void
}

export default function ProductReportModal({ isOpen, productId, productTitle, onCancel }: ProductReportModalProps) {
  const [reportError, setReportError] = useState<React.ReactNode | null>(null)

  const handleSubmit = async (data: ReportFormValues) => {
    try {
      const formData = new FormData()

      formData.append('reasonCodes', data.reasonCode)

      if (data.detailReason) {
        formData.append('detailReason', data.detailReason)
      }

      if (data.imageFiles && data.imageFiles.length > 0) {
        for (const file of data.imageFiles) {
          formData.append('imageFiles', file)
        }
      }

      await api.post(`/reports/products/${productId}`, formData)
      onCancel()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? ''
      const isDuplicate = message.includes('이미 신고된 상품') || responseMessage.includes('이미 신고된 상품')
      setReportError(
        <div className="flex flex-col gap-0.5">
          <p className="text-base font-semibold">{isDuplicate ? '이미 신고한 상품입니다.' : '상품 신고에 실패했습니다.'}</p>
          {!isDuplicate ? <p>잠시 후 다시 시도해주세요.</p> : null}
        </div>,
      )
    }
  }

  return (
    <ReportModalBase
      isOpen={isOpen}
      heading="상품 신고하기"
      description={`정말로 "${productTitle}" 상품을 신고하시겠습니까?`}
      reasons={PRODUCT_REPORT_REASON}
      onCancel={onCancel}
      onSubmit={handleSubmit}
      error={reportError}
      onClearError={() => setReportError(null)}
    />
  )
}
