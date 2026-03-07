import type { TableConfig } from '../types/adminTable'
import type { AdminWithdrawal } from '../types/adminApi'

const WITHDRAWAL_REASON_EN_TO_KO: Record<string, string> = {
  SERVICE_DISSATISFACTION: '서비스 불만족',
  PRIVACY_CONCERN: '개인정보 우려',
  LOW_USAGE: '사용 빈도 낮음',
  COMPETITOR: '경쟁 서비스 이용',
  OTHER: '기타',
}

export { WITHDRAWAL_REASON_EN_TO_KO }

export const withdrawalTableConfig: TableConfig<AdminWithdrawal> = {
  title: '탈퇴 관리',
  rowKey: 'id',
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
        if (!v) return '-'
        const d = new Date(v as string)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      },
    },
    {
      key: 'withdrawalReason',
      label: '탈퇴사유',
      type: 'badge',
      sortable: true,
      badgeOptions: [
        { value: 'SERVICE_DISSATISFACTION', label: '서비스 불만족', color: 'bg-red-100 text-red-800' },
        { value: 'PRIVACY_CONCERN', label: '개인정보 우려', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'LOW_USAGE', label: '사용 빈도 낮음', color: 'bg-gray-100 text-gray-800' },
        { value: 'COMPETITOR', label: '경쟁 서비스 이용', color: 'bg-blue-100 text-blue-800' },
        { value: 'OTHER', label: '기타', color: 'bg-gray-100 text-gray-800' },
      ],
    },
    {
      key: 'deletedAt',
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
      key: 'withdrawalReason',
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
