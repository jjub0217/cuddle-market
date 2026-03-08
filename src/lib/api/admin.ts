import { api } from './api'
import type { AdminTableResponse, SortState, FilterState } from '@/features/admin/types/adminTable'
import type { Product, ProductResponse, ProductDetailItem, ProductDetailItemResponse } from '@/types/product'
import type { CommunityItem, CommunityResponse, CommunityDetailItem, CommunityDetailItemResponse } from '@/types/community'
import type {
  AdminUser,
  AdminWithdrawal,
  AdminWithdrawalDetail,
  AdminProduct,
  AdminReport,
  MemberTrendStat,
  WithdrawalReasonStat,
  DashboardSummary,
  ApiResponse,
  PageResponse,
} from '@/features/admin/types/adminApi'

interface FetchParams {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}

// ========== 응답 변환 ==========

function toAdminTableResponse<T>(
  data: { content: T[]; totalElements: number; page: number; size: number },
  page: number,
  pageSize: number,
): AdminTableResponse<T> {
  return {
    data: data.content,
    total: data.totalElements ?? data.content.length,
    page,
    pageSize,
  }
}

// ========== Enum 매핑 (필터용: 한글 → 영문) ==========

const PRODUCT_TYPE_KO_TO_EN: Record<string, string> = {
  '팝니다': 'SELL',
  '삽니다': 'REQUEST',
}

const TRADE_STATUS_KO_TO_EN: Record<string, string> = {
  '판매중': 'SELLING',
  '요청중': 'BUYING',
  '예약중': 'RESERVED',
  '판매완료': 'COMPLETED',
  '요청완료': 'COMPLETED',
}

const CATEGORY_KO_TO_EN: Record<string, string> = {
  '사료/간식': 'FOOD',
  '장난감': 'TOY',
  '사육장/하우스': 'HOUSE',
  '건강/위생': 'HEALTH',
  '의류/악세사리': 'CLOTHING',
  '이동장/목줄': 'WALKING',
  '미용용품': 'GROOMING',
  '기타': 'ETC',
}

const BOARD_TYPE_KO_TO_EN: Record<string, string> = {
  '질문있어요': 'QUESTION',
  '정보공유': 'INFO',
}

const USER_ROLE_KO_TO_EN: Record<string, string> = {
  '일반회원': 'USER',
  '관리자': 'ADMIN',
}

const USER_STATUS_KO_TO_EN: Record<string, string> = {
  '활성': 'ACTIVE',
  '탈퇴': 'WITHDRAWN',
}

const WITHDRAWAL_REASON_KO_TO_EN: Record<string, string> = {
  '서비스 불만족': 'SERVICE_DISSATISFACTION',
  '개인정보 우려': 'PRIVACY_CONCERN',
  '사용 빈도 낮음': 'LOW_USAGE',
  '경쟁 서비스 이용': 'COMPETITOR',
  '기타': 'OTHER',
}

const REPORT_STATUS_KO_TO_EN: Record<string, string> = {
  '대기중': 'PENDING',
  '검토완료': 'REVIEWED',
  '거절': 'REJECTED',
  '조치완료': 'ACTION_TAKEN',
}

// ========== 상품 API ==========

export async function fetchAdminProducts(params: FetchParams): Promise<AdminTableResponse<AdminProduct>> {
  const searchParams = new URLSearchParams({
    page: String(params.page - 1),
    size: String(params.pageSize),
  })

  if (params.search) {
    searchParams.set('keyword', params.search)
  }
  if (params.filters?.productType) {
    searchParams.set('productType', PRODUCT_TYPE_KO_TO_EN[params.filters.productType] || params.filters.productType)
  }
  if (params.filters?.category) {
    searchParams.set('category', CATEGORY_KO_TO_EN[params.filters.category] || params.filters.category)
  }

  const { data } = await api.get<ApiResponse<PageResponse<AdminProduct>>>(`/admin/products?${searchParams.toString()}`)
  return toAdminTableResponse(data.data, params.page, params.pageSize)
}

export async function fetchAdminProductDetail(id: number): Promise<ProductDetailItem | null> {
  try {
    const { data } = await api.get<ProductDetailItemResponse>(`/products/${id}`)
    return data.data
  } catch {
    return null
  }
}

// ========== 커뮤니티 API ==========

export async function fetchAdminCommunityPosts(params: FetchParams): Promise<AdminTableResponse<CommunityItem>> {
  const searchParams = new URLSearchParams({
    page: String(params.page - 1),
    size: String(params.pageSize),
  })

  if (params.filters?.boardType) {
    searchParams.set('boardType', BOARD_TYPE_KO_TO_EN[params.filters.boardType] || params.filters.boardType)
  }
  if (params.search) {
    searchParams.set('keyword', params.search)
    searchParams.set('searchType', 'TITLE')
  }
  if (params.sort?.direction) {
    searchParams.set('sortBy', params.sort.key === 'createdAt' ? 'LATEST' : params.sort.key)
  }

  const { data } = await api.get<CommunityResponse>(`/community/posts?${searchParams.toString()}`)
  return toAdminTableResponse(data.data, params.page, params.pageSize)
}

export async function fetchAdminCommunityDetail(id: number): Promise<CommunityDetailItem | null> {
  try {
    const { data } = await api.get<CommunityDetailItemResponse>(`/community/posts/${id}`)
    return data.data
  } catch {
    return null
  }
}

// ========== 회원 관리 API ==========

export async function fetchAdminUsers(params: FetchParams): Promise<AdminTableResponse<AdminUser>> {
  const searchParams = new URLSearchParams({
    page: String(params.page - 1),
    size: String(params.pageSize),
  })

  if (params.search) {
    searchParams.set('keyword', params.search)
  }
  if (params.filters?.status) {
    searchParams.set('status', USER_STATUS_KO_TO_EN[params.filters.status] || params.filters.status)
  }
  if (params.filters?.role) {
    searchParams.set('role', USER_ROLE_KO_TO_EN[params.filters.role] || params.filters.role)
  }

  const { data } = await api.get<ApiResponse<PageResponse<AdminUser>>>(`/admin/users?${searchParams.toString()}`)
  return toAdminTableResponse(data.data, params.page, params.pageSize)
}

export async function grantAdminRole(userId: number): Promise<void> {
  await api.patch(`/admin/users/${userId}/role`)
}

// ========== 탈퇴 회원 API ==========

export async function fetchAdminWithdrawals(params: FetchParams): Promise<AdminTableResponse<AdminWithdrawal>> {
  const searchParams = new URLSearchParams({
    page: String(params.page - 1),
    size: String(params.pageSize),
  })

  if (params.search) {
    searchParams.set('keyword', params.search)
  }

  const { data } = await api.get<ApiResponse<PageResponse<AdminWithdrawal>>>(`/admin/withdrawals?${searchParams.toString()}`)
  return toAdminTableResponse(data.data, params.page, params.pageSize)
}

export async function fetchAdminWithdrawalDetail(userId: number): Promise<AdminWithdrawalDetail | null> {
  try {
    const { data } = await api.get<ApiResponse<AdminWithdrawalDetail>>(`/admin/withdrawals/${userId}`)
    return data.data
  } catch {
    return null
  }
}

export async function restoreWithdrawnUser(userId: number): Promise<void> {
  await api.post(`/admin/withdrawals/${userId}/restore`)
}

// ========== 신고 관리 API ==========

export async function fetchAdminReports(
  params: FetchParams,
  targetType?: 'USER' | 'PRODUCT' | 'COMMUNITY_POST',
): Promise<AdminTableResponse<AdminReport>> {
  const searchParams = new URLSearchParams({
    page: String(params.page - 1),
    size: String(params.pageSize),
  })

  if (targetType) {
    searchParams.set('targetType', targetType)
  }
  if (params.filters?.status) {
    searchParams.set('status', REPORT_STATUS_KO_TO_EN[params.filters.status] || params.filters.status)
  }

  const { data } = await api.get<ApiResponse<PageResponse<AdminReport> & { total: number }>>(`/admin/reports?${searchParams.toString()}`)
  return toAdminTableResponse(
    { ...data.data, totalElements: data.data.totalElements ?? data.data.total },
    params.page,
    params.pageSize,
  )
}

// 개별 신고 탭용 래퍼
export async function fetchAdminUserReports(params: FetchParams): Promise<AdminTableResponse<AdminReport>> {
  return fetchAdminReports(params, 'USER')
}

export async function fetchAdminProductReports(params: FetchParams): Promise<AdminTableResponse<AdminReport>> {
  return fetchAdminReports(params, 'PRODUCT')
}

export async function fetchAdminCommunityReports(params: FetchParams): Promise<AdminTableResponse<AdminReport>> {
  return fetchAdminReports(params, 'COMMUNITY_POST')
}

export async function reviewReport(
  reportId: number,
  body: { status: string; rejectedReason?: string; actionNote?: string },
): Promise<void> {
  await api.patch(`/admin/reports/${reportId}/review`, body)
}

// ========== 통계 API ==========

export async function fetchMemberStats(): Promise<MemberTrendStat[]> {
  const { data } = await api.get<ApiResponse<MemberTrendStat[]>>('/admin/statistics/trends')
  return data.data
}

export async function fetchWithdrawalReasons(): Promise<WithdrawalReasonStat[]> {
  const { data } = await api.get<ApiResponse<WithdrawalReasonStat[]>>('/admin/statistics/withdrawal-reasons')
  return data.data
}

// ========== 대시보드 API ==========

export async function fetchDashboardStats(): Promise<DashboardSummary> {
  const { data } = await api.get<ApiResponse<DashboardSummary>>('/admin/statistics/summary')
  return data.data
}
