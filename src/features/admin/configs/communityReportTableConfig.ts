import type { TableConfig } from '../types/adminTable'
import type { MockCommunityReport } from '../mocks/mockCommunityReports'

export const communityReportTableConfig: TableConfig<MockCommunityReport> = {
  title: '커뮤니티 신고 관리',
  searchable: true,
  searchPlaceholder: '게시글 제목 또는 작성자 검색...',
  columns: [
    { key: 'id', label: '신고 ID', type: 'number', sortable: true, width: '90px' },
    { key: 'boardType', label: '게시글 유형', type: 'text', sortable: true, width: '110px' },
    { key: 'reporterNickname', label: '신고자', type: 'text', sortable: true },
    { key: 'postTitle', label: '제목', type: 'text', sortable: true },
    { key: 'authorNickname', label: '작성자', type: 'text', sortable: true },
    { key: 'reasonCode', label: '신고 항목', type: 'text', sortable: true },
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
      key: 'reasonCode',
      label: '신고 항목',
      options: [
        { value: '욕설, 비방, 혐오 표현', label: '욕설, 비방, 혐오 표현' },
        { value: '도배 게시물', label: '도배 게시물' },
        { value: '음란물/불건전 콘텐츠', label: '음란물/불건전 콘텐츠' },
        { value: '스팸/광고성 메시지', label: '스팸/광고성 메시지' },
        { value: '자해 또는 자살 의도를 포함', label: '자해 또는 자살 의도를 포함' },
        { value: '기타', label: '기타' },
      ],
    },
    {
      key: 'sort',
      label: '정렬',
      options: [
        { value: '최신순', label: '최신순' },
        { value: '오래된 순', label: '오래된 순' },
      ],
    },
  ],
  actions: [],
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  },
}
