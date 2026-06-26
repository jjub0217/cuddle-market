import type { AdminTableResponse, SortState, FilterState } from '../types/adminTable'
import type { AdminReport } from '../types/adminApi'

const REASON_CODES = [
  'FALSE_OR_SCAM', 'ILLEGAL_ITEM', 'INAPPROPRIATE_IMAGE',
  'DUPLICATE_POST', 'SPAM_OR_AD', 'PROXY_PAYMENT_OR_TRADE',
  'PROFESSIONAL_SELLER', 'ETC',
]

const PRODUCT_NAMES = [
  '강아지 자동 급식기', '고양이 원목 캣타워', '노즈워크 코지 매트', '반려견 노이즈 캐리어',
  '대형견 하네스 세트', '고양이 자동 화장실', '반려동물 빗 슬리커 브러시', '강아지 방수 레인코트',
  '고양이 낚싯대 장난감', '대형 강아지 방석 쿠션', '반려견 유모차', '고양이 사료 정수기',
]

const STATUSES: AdminReport['status'][] = ['PENDING', 'REVIEWED', 'REJECTED', 'ACTION_TAKEN']

function randomDate(start: Date, end: Date): string {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return d.toISOString()
}

function generateProductSellReports(count: number): AdminReport[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    reporterId: 100 + i,
    reporterNickname: `신고자${100 + i}`,
    targetType: 'PRODUCT' as const,
    targetId: 300 + i,
    targetNickname: `판매자${300 + i}`,
    title: PRODUCT_NAMES[i % PRODUCT_NAMES.length],
    boardType: null,
    reasonCodes: [REASON_CODES[i % REASON_CODES.length]],
    detailReason: i % 3 === 0 ? '상품 신고 상세 사유입니다.' : null,
    imageUrls: i % 4 === 0 ? [`https://picsum.photos/seed/preport${i + 1}/200/200`] : null,
    status: STATUSES[i % STATUSES.length],
    createdAt: randomDate(new Date('2024-01-01'), new Date('2025-12-31')),
    reviewedAt: null,
    rejectedReason: null,
  }))
}

const productSellReports = generateProductSellReports(25)

export function getMockProductSellReports(params: {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}): AdminTableResponse<AdminReport> {
  let filtered = [...productSellReports]

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
