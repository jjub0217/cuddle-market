import { api } from './api'
import { useUserStore } from '@/store/userStore'
import type { AdminTableResponse, SortState, FilterState } from '@/features/admin/types/adminTable'
import type { Product, ProductResponse, ProductDetailItem, ProductDetailItemResponse } from '@/types/product'
import type { CommunityItem, CommunityResponse, CommunityDetailItem, CommunityDetailItemResponse } from '@/types/community'
import type { MockUser } from '@/features/admin/mocks/mockUsers'
import type { MockWithdrawal } from '@/features/admin/mocks/mockWithdrawals'
import type { MonthlyMemberStat, WithdrawalReasonStat, MonthlyWithdrawalReasonStat } from '@/features/admin/mocks/mockMemberStats'
import type { MockUserReport } from '@/features/admin/mocks/mockUserReports'
import type { MockProductSellReport } from '@/features/admin/mocks/mockProductSellReports'
import type { MockProductRequestReport } from '@/features/admin/mocks/mockProductRequestReports'
import type { MockCommunityReport } from '@/features/admin/mocks/mockCommunityReports'

interface FetchParams {
  page: number
  pageSize: number
  sort?: SortState
  filters?: FilterState
  search?: string
}

/** 로그인 상태이고 실제 API가 존재할 때만 호출, 아니면 목 데이터 사용 */
function hasAuth(): boolean {
  return !!useUserStore.getState().accessToken
}

// ========== 응답 변환 ==========

/** Spring Boot Page 응답 → AdminTableResponse 변환 */
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

// ========== 상품 API ==========

export async function fetchAdminProducts(params: FetchParams): Promise<AdminTableResponse<Product>> {
  if (hasAuth()) {
    try {
      const searchParams = new URLSearchParams({
        page: String(params.page - 1), // Spring은 0-based
        size: String(params.pageSize),
      })

      if (params.search) {
        searchParams.set('keyword', params.search)
      }
      if (params.filters?.productType) {
        searchParams.set('productType', PRODUCT_TYPE_KO_TO_EN[params.filters.productType] || params.filters.productType)
      }
      if (params.filters?.tradeStatus) {
        // tradeStatus는 검색 API에서 직접 지원하지 않을 수 있음
      }
      if (params.filters?.category) {
        searchParams.set('categories', CATEGORY_KO_TO_EN[params.filters.category] || params.filters.category)
      }
      if (params.sort?.direction) {
        searchParams.set('sortBy', params.sort.key)
        searchParams.set('sortOrder', params.sort.direction === 'asc' ? 'ASC' : 'DESC')
      }

      const { data } = await api.get<ProductResponse>(`/products/search?${searchParams.toString()}`)
      return toAdminTableResponse(data.data, params.page, params.pageSize)
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { getMockProducts } = await import('@/features/admin/mocks/mockProducts')
  return getMockProducts(params) as unknown as AdminTableResponse<Product>
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
  if (hasAuth()) {
    try {
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
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { getMockCommunityPosts } = await import('@/features/admin/mocks/mockCommunityPosts')
  return getMockCommunityPosts(params) as unknown as AdminTableResponse<CommunityItem>
}

export async function fetchAdminCommunityDetail(id: number): Promise<CommunityDetailItem | null> {
  try {
    const { data } = await api.get<CommunityDetailItemResponse>(`/community/posts/${id}`)
    return data.data
  } catch {
    return null
  }
}

// ========== 이하 아직 실제 API 없는 도메인 (mock 유지) ==========

// 사용자 목록 조회
export async function fetchAdminUsers(params: FetchParams): Promise<AdminTableResponse<MockUser>> {
  const { getMockUsers } = await import('@/features/admin/mocks/mockUsers')
  return getMockUsers(params)
}

// 탈퇴 회원 목록 조회
export async function fetchAdminWithdrawals(params: FetchParams): Promise<AdminTableResponse<MockWithdrawal>> {
  const { getMockWithdrawals } = await import('@/features/admin/mocks/mockWithdrawals')
  return getMockWithdrawals(params)
}

// 월별 가입/탈퇴 추세 데이터
export async function fetchMemberStats(): Promise<MonthlyMemberStat[]> {
  const { mockMemberStats } = await import('@/features/admin/mocks/mockMemberStats')
  return mockMemberStats
}

// 탈퇴 사유별 통계
export async function fetchWithdrawalReasons(): Promise<WithdrawalReasonStat[]> {
  const { mockWithdrawalReasons } = await import('@/features/admin/mocks/mockMemberStats')
  return mockWithdrawalReasons
}

// 탈퇴 사유별 월별 추세
export async function fetchMonthlyWithdrawalReasons(): Promise<MonthlyWithdrawalReasonStat[]> {
  const { mockMonthlyWithdrawalReasons } = await import('@/features/admin/mocks/mockMemberStats')
  return mockMonthlyWithdrawalReasons
}

// 유저신고 목록 조회
export async function fetchAdminUserReports(params: FetchParams): Promise<AdminTableResponse<MockUserReport>> {
  const { getMockUserReports } = await import('@/features/admin/mocks/mockUserReports')
  return getMockUserReports(params)
}

// 판매상품 신고 목록 조회
export async function fetchAdminProductSellReports(params: FetchParams): Promise<AdminTableResponse<MockProductSellReport>> {
  const { getMockProductSellReports } = await import('@/features/admin/mocks/mockProductSellReports')
  return getMockProductSellReports(params)
}

// 판매요청 상품 신고 목록 조회
export async function fetchAdminProductRequestReports(params: FetchParams): Promise<AdminTableResponse<MockProductRequestReport>> {
  const { getMockProductRequestReports } = await import('@/features/admin/mocks/mockProductRequestReports')
  return getMockProductRequestReports(params)
}

// 커뮤니티 신고 목록 조회
export async function fetchAdminCommunityReports(params: FetchParams): Promise<AdminTableResponse<MockCommunityReport>> {
  const { getMockCommunityReports } = await import('@/features/admin/mocks/mockCommunityReports')
  return getMockCommunityReports(params)
}

// 대시보드 통계
export interface DashboardStats {
  totalProducts: number
  totalUsers: number
  totalTransactions: number
  totalRevenue: number
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return {
    totalProducts: 50,
    totalUsers: 30,
    totalTransactions: 40,
    totalRevenue: 4_850_000,
  }
}
