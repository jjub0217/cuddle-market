/** GET /api/admin/users 응답 아이템 */
export interface AdminUser {
  id: number
  email: string
  name: string
  nickname: string
  birthDate: string | null
  addressSido: string | null
  addressGugun: string | null
  role: 'USER' | 'ADMIN'
  createdAt: string
  status: 'ACTIVE' | 'WITHDRAWN'
}

/** GET /api/admin/withdrawals 응답 아이템 */
export interface AdminWithdrawal {
  id: number
  email: string
  nickname: string
  name: string
  role: string
  addressSido: string | null
  addressGugun: string | null
  birthDate: string | null
  withdrawalReason: string
  withdrawalDetailReason: string | null
  deletedAt: string
}

/** GET /api/admin/withdrawals/{userId} 상세 응답 */
export interface AdminWithdrawalDetail extends AdminWithdrawal {
  createdAt: string
  profileImageUrl: string | null
}

/** GET /api/admin/products 응답 아이템 */
export interface AdminProduct {
  id: number
  title: string
  price: number
  productType: string
  category: string
  productStatus: string
  tradeStatus: string | null
  sellerNickname: string
  createdAt: string
  updatedAt: string
}

/** GET /api/admin/reports 응답 아이템 */
export interface AdminReport {
  id: number
  reporterId: number
  reporterNickname: string | null
  targetType: 'USER' | 'PRODUCT' | 'COMMUNITY_POST'
  targetId: number
  targetNickname: string | null
  title: string | null
  boardType: string | null
  reasonCodes: string[]
  detailReason: string | null
  imageUrls: string[] | null
  status: 'PENDING' | 'REVIEWED' | 'REJECTED' | 'ACTION_TAKEN'
  createdAt: string
  reviewedAt: string | null
  rejectedReason: string | null
}

/** GET /api/admin/statistics/trends 응답 아이템 */
export interface MemberTrendStat {
  yearMonth: string
  signupCount: number
  withdrawalCount: number
}

/** GET /api/admin/statistics/withdrawal-reasons 응답 아이템 */
export interface WithdrawalReasonStat {
  reason: string
  count: number
}

/** 탈퇴 사유별 월별 추세 데이터 */
export interface MonthlyWithdrawalReasonStat {
  month: string
  SERVICE_DISSATISFACTION: number
  PRIVACY_CONCERN: number
  LOW_USAGE: number
  COMPETITOR: number
  OTHER: number
}

/** GET /api/admin/statistics/summary 응답 */
export interface DashboardSummary {
  totalUserCount: number
  activeUserCount: number
  withdrawnUserCount: number
  totalProductCount: number
  activeProductCount: number
}

/** 공통 Spring Boot Page 응답 래퍼 */
export interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious?: boolean
}
