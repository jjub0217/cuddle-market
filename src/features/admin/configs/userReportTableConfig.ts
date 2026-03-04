import type { TableConfig } from '../types/adminTable'
import type { MockUserReport } from '../mocks/mockUserReports'

export const userReportTableConfig: TableConfig<MockUserReport> = {
  title: '유저 신고 관리',
  searchable: true,
  searchPlaceholder: '신고자 또는 신고 대상자 닉네임 검색...',
  columns: [
    { key: 'id', label: '신고 ID', type: 'number', sortable: true, width: '90px' },
    { key: 'reporterNickname', label: '신고자', type: 'text', sortable: true },
    { key: 'targetNickname', label: '신고 대상자 닉네임', type: 'text', sortable: true },
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
        { value: '욕설, 비방, 괴롭힘', label: '욕설, 비방, 괴롭힘' },
        { value: '사기, 허위 거래 시도', label: '사기, 허위 거래 시도' },
        { value: '음란물 또는 불건전 행위', label: '음란물 또는 불건전 행위' },
        { value: '스팸/광고성 메시지', label: '스팸/광고성 메시지' },
        { value: '불쾌한 사용자 정보 내용', label: '불쾌한 사용자 정보 내용' },
        { value: '만 14세 미만 유저', label: '만 14세 미만 유저' },
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
