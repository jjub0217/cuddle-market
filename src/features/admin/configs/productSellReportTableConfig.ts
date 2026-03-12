import type { TableConfig } from '../types/adminTable'
import type { AdminReport } from '../types/adminApi'

const PRODUCT_REPORT_REASON_EN_TO_KO: Record<string, string> = {
  FALSE_OR_SCAM: '허위/사기성 상품',
  ILLEGAL_ITEM: '불법/금지 품목',
  INAPPROPRIATE_IMAGE: '부적절한 이미지',
  DUPLICATE_POST: '중복 게시물',
  SPAM_OR_AD: '스팸/광고',
  PROXY_PAYMENT_OR_TRADE: '대리 결제/거래',
  PROFESSIONAL_SELLER: '전문 판매 업자',
  ETC: '기타',
}

export { PRODUCT_REPORT_REASON_EN_TO_KO }

export const productSellReportTableConfig: TableConfig<AdminReport> = {
  title: '상품 신고 관리',
  rowKey: 'id',
  searchable: false,
  columns: [
    { key: 'id', label: '신고 ID', type: 'number', sortable: true, width: '90px' },
    { key: 'title', label: '상품명', type: 'text' },
    { key: 'reporterNickname', label: '신고자', type: 'text', width: '100px' },
    { key: 'targetNickname', label: '판매자', type: 'text', width: '100px' },
    {
      key: 'reasonCodes',
      label: '신고항목',
      type: 'text',
      format: (v) => {
        const codes = v as string[]
        return codes.map((c) => PRODUCT_REPORT_REASON_EN_TO_KO[c] || c).join(', ')
      },
    },
    {
      key: 'createdAt',
      label: '신고일자',
      type: 'date',
      sortable: true,
      width: '120px',
      format: (v) => {
        const d = new Date(v as string)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      },
    },
  ],
  filters: [
    {
      key: 'status',
      label: '처리 상태',
      options: [
        { value: '대기중', label: '대기중' },
        { value: '검토완료', label: '검토완료' },
        { value: '거절', label: '거절' },
        { value: '조치완료', label: '조치완료' },
      ],
    },
  ],
  actions: [],
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  },
}
