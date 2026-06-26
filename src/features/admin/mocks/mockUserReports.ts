import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'
import type { AdminReport } from '../types/adminApi'

const REASON_CODES = [
  'HARASSMENT', 'FRAUD', 'INAPPROPRIATE_CONTENT',
  'SPAM', 'OFFENSIVE_PROFILE', 'UNDERAGE', 'OTHER',
]

const STATUSES: AdminReport['status'][] = ['PENDING', 'REVIEWED', 'REJECTED', 'ACTION_TAKEN']

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString()
}

function generateUserReports(count: number): AdminReport[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    reporterId: 100 + i,
    reporterNickname: `신고자${100 + i}`,
    targetType: 'USER' as const,
    targetId: 200 + i,
    targetNickname: `피신고자${200 + i}`,
    title: null,
    boardType: null,
    reasonCodes: [REASON_CODES[i % REASON_CODES.length]],
    detailReason: i % 3 === 0 ? '신고 상세 사유입니다.' : null,
    imageUrls: i % 4 === 0 ? [`https://picsum.photos/seed/ureport${i + 1}/200/200`] : null,
    status: STATUSES[i % STATUSES.length],
    createdAt: randomDate(new Date('2024-01-01'), new Date('2025-12-31')),
    reviewedAt: null,
    rejectedReason: null,
  }))
}

const userReports = generateUserReports(25)

export function getMockUserReports(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<AdminReport> {
  let filtered = [...userReports]

  if (params.filters?.status) {
    filtered = filtered.filter((r) => r.status === params.filters!.status)
  }

  if (params.sort?.direction) {
    const { key, direction } = params.sort
    filtered.sort((a, b) => {
      const aVal = a[key as keyof AdminReport]
      const bVal = b[key as keyof AdminReport]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })
  }

  const total = filtered.length
  const start = (params.page - 1) * params.pageSize
  const data = filtered.slice(start, start + params.pageSize)

  return { data, total, page: params.page, pageSize: params.pageSize }
}
