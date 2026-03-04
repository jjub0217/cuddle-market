import type { TableConfig } from '../types/adminTable'
import type { MockWithdrawal } from '../mocks/mockWithdrawals'

export const withdrawalTableConfig: TableConfig<MockWithdrawal> = {
  title: '탈퇴 관리',
  searchable: true,
  searchPlaceholder: '닉네임 또는 이메일 검색...',
  columns: [
    { key: 'id', label: 'ID', type: 'number', sortable: true, width: '70px' },
    { key: 'email', label: '이메일', type: 'text', sortable: true },
    { key: 'nickname', label: '닉네임', type: 'text', sortable: true },
    { key: 'name', label: '이름', type: 'text', sortable: true },
    {
      key: 'birthDate',
      label: '생년월일',
      type: 'date',
      sortable: true,
      width: '120px',
      format: (v) => {
        const d = new Date(v as string)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      },
    },
    { key: 'reason', label: '탈퇴사유', type: 'text', sortable: true },
    {
      key: 'withdrawnAt',
      label: '탈퇴 일시',
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
      key: 'reason',
      label: '탈퇴사유',
      options: [
        { value: '서비스 불만족', label: '서비스 불만족' },
        { value: '개인정보 우려', label: '개인정보 우려' },
        { value: '사용 빈도 낮음', label: '사용 빈도 낮음' },
        { value: '경쟁 서비스 이용', label: '경쟁 서비스 이용' },
        { value: '기타', label: '기타' },
      ],
    },
  ],
  actions: [],
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  },
}
