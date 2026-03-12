import type { TableConfig } from '../types/adminTable'
import type { AdminReport } from '../types/adminApi'

const COMMUNITY_REPORT_REASON_EN_TO_KO: Record<string, string> = {
  ABUSE_OR_HATE: '욕설/비방/혐오',
  SPAM_OR_AD: '스팸/광고',
  INAPPROPRIATE_CONTENT: '음란물/불건전',
  REPETITIVE_POST: '도배 게시물',
  SELF_HARM_OR_SUICIDE: '자해/자살 의도',
  ETC: '기타',
}

export { COMMUNITY_REPORT_REASON_EN_TO_KO }

export const communityReportTableConfig: TableConfig<AdminReport> = {
  title: '커뮤니티 신고 관리',
  rowKey: 'id',
  searchable: false,
  columns: [
    { key: 'id', label: '신고 ID', type: 'number', sortable: true, width: '90px' },
    {
      key: 'targetType',
      label: '게시글 유형',
      type: 'text',
      width: '110px',
      format: (v) => {
        const typeMap: Record<string, string> = { COMMUNITY_POST: '커뮤니티 게시글' }
        return typeMap[v as string] || (v as string)
      },
    },
    { key: 'reporterId', label: '신고자', type: 'number', width: '80px' },
    { key: 'targetId', label: '게시글 ID', type: 'number', width: '100px' },
    {
      key: 'reasonCodes',
      label: '신고항목',
      type: 'text',
      format: (v) => {
        const codes = v as string[]
        return codes.map((c) => COMMUNITY_REPORT_REASON_EN_TO_KO[c] || c).join(', ')
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
