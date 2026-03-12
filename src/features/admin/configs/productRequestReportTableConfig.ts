import { PRODUCT_REPORT_REASON_EN_TO_KO } from './productSellReportTableConfig'
import type { TableConfig } from '../types/adminTable'
import type { AdminReport } from '../types/adminApi'

export const productRequestReportTableConfig: TableConfig<AdminReport> = {
  title: '판매요청 상품 신고 관리',
  rowKey: 'id',
  searchable: false,
  columns: [
    { key: 'id', label: '신고 ID', type: 'number', sortable: true, width: '90px' },
    { key: 'reporterNickname', label: '신고자', type: 'text', width: '100px' },
    { key: 'title', label: '상품명', type: 'text' },
    { key: 'targetNickname', label: '요청자', type: 'text', width: '100px' },
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
