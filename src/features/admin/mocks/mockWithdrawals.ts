import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'
import type { AdminWithdrawal } from '../types/adminApi'

const NAMES = [
  '김민수', '이서연', '박지호', '최수아', '정도윤',
  '강하은', '조유준', '윤서진', '임지아', '한민재',
  '오예린', '신동현', '황수빈', '배준서', '류하윤',
]

const WITHDRAWAL_REASONS = [
  'SERVICE_DISSATISFACTION', 'PRIVACY_CONCERN', 'LOW_USAGE', 'COMPETITOR', 'OTHER',
]

const withdrawals: AdminWithdrawal[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: NAMES[i % NAMES.length],
  nickname: `사용자${String(i + 1).padStart(2, '0')}`,
  email: `user${String(i + 1).padStart(2, '0')}@example.com`,
  role: 'USER',
  addressSido: null,
  addressGugun: null,
  birthDate: `199${i % 10}-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
  withdrawalReason: WITHDRAWAL_REASONS[i % WITHDRAWAL_REASONS.length],
  withdrawalDetailReason: i % 3 === 0 ? '서비스가 기대에 미치지 못했습니다.' : null,
  deletedAt: `2026-03-${String(Math.max(1, 30 - i)).padStart(2, '0')}T00:00:00`,
}))

export function getMockWithdrawals(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<AdminWithdrawal> {
  let filtered = [...withdrawals]

  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (w) => w.nickname.toLowerCase().includes(q) || w.email.toLowerCase().includes(q),
    )
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value) {
        filtered = filtered.filter((w) => String(w[key as keyof AdminWithdrawal]) === value)
      }
    }
  }

  if (params.sort?.direction) {
    const { key, direction } = params.sort
    filtered.sort((a, b) => {
      const aVal = String(a[key as keyof AdminWithdrawal])
      const bVal = String(b[key as keyof AdminWithdrawal])
      return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    })
  }

  const start = (params.page - 1) * params.pageSize
  return {
    data: filtered.slice(start, start + params.pageSize),
    total: filtered.length,
    page: params.page,
    pageSize: params.pageSize,
  }
}
