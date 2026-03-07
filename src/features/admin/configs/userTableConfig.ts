import type { TableConfig } from '../types/adminTable'
import type { AdminUser } from '../types/adminApi'

const USER_ROLE_EN_TO_KO: Record<string, string> = {
  USER: '일반회원',
  ADMIN: '관리자',
}

const USER_STATUS_EN_TO_KO: Record<string, string> = {
  ACTIVE: '활성',
  WITHDRAWN: '탈퇴',
}

export { USER_ROLE_EN_TO_KO, USER_STATUS_EN_TO_KO }

export const userTableConfig: TableConfig<AdminUser> = {
  title: '사용자 관리',
  rowKey: 'id',
  searchable: true,
  searchPlaceholder: '닉네임 또는 이메일 검색...',
  columns: [
    { key: 'id', label: 'ID', type: 'number', sortable: true, width: '70px' },
    { key: 'email', label: '이메일', type: 'text', sortable: true },
    { key: 'nickname', label: '닉네임', type: 'text', sortable: true },
    { key: 'name', label: '이름', type: 'text', sortable: true },
    {
      key: 'role',
      label: '권한',
      type: 'badge',
      sortable: true,
      width: '100px',
      badgeOptions: [
        { value: 'USER', label: '일반회원', color: 'bg-gray-100 text-gray-800' },
        { value: 'ADMIN', label: '관리자', color: 'bg-purple-100 text-purple-800' },
      ],
    },
    {
      key: 'status',
      label: '상태',
      type: 'badge',
      sortable: true,
      width: '100px',
      badgeOptions: [
        { value: 'ACTIVE', label: '활성', color: 'bg-green-100 text-green-800' },
        { value: 'WITHDRAWN', label: '탈퇴', color: 'bg-gray-100 text-gray-800' },
      ],
    },
    {
      key: 'createdAt',
      label: '가입일',
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
      label: '상태',
      options: [
        { value: '활성', label: '활성' },
        { value: '탈퇴', label: '탈퇴' },
      ],
    },
    {
      key: 'role',
      label: '권한',
      options: [
        { value: '일반회원', label: '일반회원' },
        { value: '관리자', label: '관리자' },
      ],
    },
  ],
  actions: [],
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  },
}
