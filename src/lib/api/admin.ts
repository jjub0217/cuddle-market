import { api } from './api'
import { useUserStore } from '@/store/userStore'
import type { AdminTableResponse, SortState, FilterState } from '@/features/admin/types/adminTable'
import type { MockProduct } from '@/features/admin/mocks/mockProducts'
import type { MockUser } from '@/features/admin/mocks/mockUsers'
import type { MockWithdrawal } from '@/features/admin/mocks/mockWithdrawals'
import type { MonthlyMemberStat, WithdrawalReasonStat, MonthlyWithdrawalReasonStat } from '@/features/admin/mocks/mockMemberStats'
import type { MockCommunityPost } from '@/features/admin/mocks/mockCommunityPosts'
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

// 상품 목록 조회
export async function fetchAdminProducts(params: FetchParams): Promise<AdminTableResponse<MockProduct>> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/products', { params })
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { getMockProducts } = await import('@/features/admin/mocks/mockProducts')
  return getMockProducts(params)
}

// 사용자 목록 조회
export async function fetchAdminUsers(params: FetchParams): Promise<AdminTableResponse<MockUser>> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/users', { params })
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { getMockUsers } = await import('@/features/admin/mocks/mockUsers')
  return getMockUsers(params)
}

// 탈퇴 회원 목록 조회
export async function fetchAdminWithdrawals(params: FetchParams): Promise<AdminTableResponse<MockWithdrawal>> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/withdrawals', { params })
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { getMockWithdrawals } = await import('@/features/admin/mocks/mockWithdrawals')
  return getMockWithdrawals(params)
}

// 월별 가입/탈퇴 추세 데이터
export async function fetchMemberStats(): Promise<MonthlyMemberStat[]> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/members/stats')
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { mockMemberStats } = await import('@/features/admin/mocks/mockMemberStats')
  return mockMemberStats
}

// 탈퇴 사유별 통계
export async function fetchWithdrawalReasons(): Promise<WithdrawalReasonStat[]> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/members/withdrawal-reasons')
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { mockWithdrawalReasons } = await import('@/features/admin/mocks/mockMemberStats')
  return mockWithdrawalReasons
}

// 탈퇴 사유별 월별 추세
export async function fetchMonthlyWithdrawalReasons(): Promise<MonthlyWithdrawalReasonStat[]> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/members/monthly-withdrawal-reasons')
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { mockMonthlyWithdrawalReasons } = await import('@/features/admin/mocks/mockMemberStats')
  return mockMonthlyWithdrawalReasons
}

// 커뮤니티 게시글 목록 조회
export async function fetchAdminCommunityPosts(params: FetchParams): Promise<AdminTableResponse<MockCommunityPost>> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/community', { params })
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { getMockCommunityPosts } = await import('@/features/admin/mocks/mockCommunityPosts')
  return getMockCommunityPosts(params)
}

// 유저신고 목록 조회
export async function fetchAdminUserReports(params: FetchParams): Promise<AdminTableResponse<MockUserReport>> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/reports/user', { params })
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { getMockUserReports } = await import('@/features/admin/mocks/mockUserReports')
  return getMockUserReports(params)
}

// 판매상품 신고 목록 조회
export async function fetchAdminProductSellReports(params: FetchParams): Promise<AdminTableResponse<MockProductSellReport>> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/reports/product-sell', { params })
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { getMockProductSellReports } = await import('@/features/admin/mocks/mockProductSellReports')
  return getMockProductSellReports(params)
}

// 판매요청 상품 신고 목록 조회
export async function fetchAdminProductRequestReports(params: FetchParams): Promise<AdminTableResponse<MockProductRequestReport>> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/reports/product-request', { params })
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  const { getMockProductRequestReports } = await import('@/features/admin/mocks/mockProductRequestReports')
  return getMockProductRequestReports(params)
}

// 커뮤니티 신고 목록 조회
export async function fetchAdminCommunityReports(params: FetchParams): Promise<AdminTableResponse<MockCommunityReport>> {
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/reports/community', { params })
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
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
  if (hasAuth()) {
    try {
      const { data } = await api.get('/admin/dashboard/stats')
      return data
    } catch {
      // API 실패 시 목 데이터 fallback
    }
  }
  return {
    totalProducts: 50,
    totalUsers: 30,
    totalTransactions: 40,
    totalRevenue: 4_850_000,
  }
}
