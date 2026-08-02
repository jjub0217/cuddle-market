import { PRODUCT_REPORT_REASON } from '@/constants/constants'
import { api } from '@/lib/api/api'
import { isAlreadyReported } from '@/lib/api/reportErrors'
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
      // 서버는 JSON을 받는다 (@RequestBody ProductReportRequest).
      // 예전에는 FormData로 보내고 있어서 multipart를 못 읽고 500이 났다 (#808).
      //
      // ⚠️ 상품만 reasonCodes(배열)다. 사용자·게시글은 reasonCode(문자열)다.
      //
      // imageFiles는 이름과 달리 파일이 아니라 **이미 올라간 URL**이다 —
      // DropzoneArea가 /images에 먼저 올리고 URL을 넣어 준다. 그리고 subImagesField를
      // 안 넘겨서 값이 배열이 아니라 문자열 하나로 들어온다. 그래서 flat()으로 편다
      // (사용자 신고 모달이 쓰던 방법과 같다).
      const imageUrls = data.imageFiles ? [data.imageFiles].flat().filter(Boolean) : []

      await api.post(`/reports/products/${productId}`, {
        reasonCodes: [data.reasonCode],
        ...(data.detailReason ? { detailReason: data.detailReason } : {}),
        ...(imageUrls.length > 0 ? { imageUrls } : {}),
      })
      onCancel()
    } catch (error) {
      const isDuplicate = isAlreadyReported(error)
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
