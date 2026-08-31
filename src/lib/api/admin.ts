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
import { getMockProducts } from '@/features/admin/mocks/mockProducts'
import { getMockCommunityPosts } from '@/features/admin/mocks/mockCommunityPosts'
import { getMockUsers } from '@/features/admin/mocks/mockUsers'
import { getMockWithdrawals } from '@/features/admin/mocks/mockWithdrawals'
import { getMockUserReports } from '@/features/admin/mocks/mockUserReports'
import { getMockProductSellReports } from '@/features/admin/mocks/mockProductSellReports'
import { getMockCommunityReports } from '@/features/admin/mocks/mockCommunityReports'
import { mockMemberStats, mockWithdrawalReasons } from '@/features/admin/mocks/mockMemberStats'

// 데모 모드: NEXT_PUBLIC_DEMO_MODE=true 인 배포에서만 목업 데이터로 어드민을 보여줌
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

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

const CONDITION_KO_TO_EN: Record<string, string> = {
  '새 상품': 'NEW',
  '거의 새것': 'LIKE_NEW',
  '사용감 있음': 'USED',
  '수리 필요': 'NEED_REPAIR',
}

// 신고 처리상태: config badge value는 한글이라 목업 영문 status를 한글로 변환
const REPORT_STATUS_EN_TO_KO: Record<string, string> = {
  PENDING: '대기중',
  REVIEWED: '검토완료',
  REJECTED: '거절',
  ACTION_TAKEN: '조치완료',
}

// ========== 상품 API ==========

export async function fetchAdminProducts(params: FetchParams): Promise<AdminTableResponse<AdminProduct>> {
  if (DEMO_MODE) {
    const mock = getMockProducts(params)
    return {
      ...mock,
      data: mock.data.map((p) => ({
        ...p,
        // 테이블 config는 title/sellerNickname 키를 기대
        title: p.name,
        sellerNickname: p.nickname,
        // badge 색상은 영문 value에 매칭되므로 한글 → 영문 변환
        productType: PRODUCT_TYPE_KO_TO_EN[p.productType] ?? p.productType,
        tradeStatus: TRADE_STATUS_KO_TO_EN[p.tradeStatus] ?? p.tradeStatus,
        productStatus: CONDITION_KO_TO_EN[p.condition] ?? p.condition,
      })),
    } as unknown as AdminTableResponse<AdminProduct>
  }

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

  // tradeStatus가 null인 경우 productType에 따라 기본값 설정
  const normalized = data.data.content.map((item) => ({
    ...item,
    tradeStatus: item.tradeStatus ?? (item.productType === 'REQUEST' ? 'BUYING' : 'SELLING'),
  }))

  return toAdminTableResponse({ ...data.data, content: normalized }, params.page, params.pageSize)
}

export async function fetchAdminProductDetail(id: number): Promise<ProductDetailItem | null> {
  try {
    const { data } = await api.get<ProductDetailItemResponse>(`/products/${id}`)
    return data.data
  } catch {
    return null
  }
}

// 어드민 상품 삭제. 성공하면 서버가 SuccessResponse 를 주지만 쓸 값이 없어 받지 않는다.
// 실패는 axios 가 그대로 던진다 — 호출부에서 잡아 알린다.
//
// ⚠️ **`/admin/products/...` 가 아니라 일반 상품 길이다.** 서버가 이 길에서 이미
//    「판매자 본인 **또는 관리자**」를 허용한다(`ProductServiceImpl` 의 `deleteProduct` —
//    `isOwner || isAdmin`). 그래서 관리자는 이 길로 남의 상품도 지울 수 있다.
//
// ⚠️ 어드민 전용 길(`/api/admin/products/{id}`)을 새로 파지 않은 까닭:
//    ① 서버를 배포해야 쓸 수 있는데 지금 얻는 것이 없다
//    ② 그쪽은 `@PreAuthorize("hasRole('ADMIN')")` 라 **JWT 안의** 역할을 본다.
//       이 길은 도메인이 **DB 의** `user.role` 을 보므로, 관리자로 올린 뒤 토큰을
//       새로 안 받았어도 동작한다
export async function deleteAdminProduct(id: number): Promise<void> {
  if (DEMO_MODE) return
  await api.delete(`/products/${id}`)
}

// ========== 커뮤니티 API ==========

export async function fetchAdminCommunityPosts(params: FetchParams): Promise<AdminTableResponse<CommunityItem>> {
  if (DEMO_MODE) {
    const mock = getMockCommunityPosts(params)
    return {
      ...mock,
      data: mock.data.map((p) => ({
        ...p,
        authorNickname: p.nickname,
        commentCount: p.comments?.length ?? 0,
        boardType: BOARD_TYPE_KO_TO_EN[p.boardType] ?? p.boardType,
      })),
    } as unknown as AdminTableResponse<CommunityItem>
  }

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
  if (DEMO_MODE) {
    const mock = getMockCommunityPosts({ page: 1, pageSize: 1000 }).data.find((p) => p.id === id)
    if (!mock) return null
    return {
      ...mock,
      authorNickname: mock.nickname,
      boardType: BOARD_TYPE_KO_TO_EN[mock.boardType] ?? mock.boardType,
      imageUrls: [mock.image, ...(mock.subImages ?? [])].filter(Boolean),
    } as unknown as CommunityDetailItem
  }
  try {
    const { data } = await api.get<CommunityDetailItemResponse>(`/community/posts/${id}`)
    return data.data
  } catch {
    return null
  }
}

// 데모 모드 전용: 필터 드롭다운의 한글 value를 mock 데이터의 영문 코드로 변환.
// (실제 분기가 백엔드 호출 전 KO_TO_EN 하는 것과 동일한 변환을 mock 호출 전에 적용해야
//  한글 필터값과 영문 mock 값이 맞아 필터가 동작함)
function mapDemoFilters(params: FetchParams, maps: Record<string, Record<string, string>>): FetchParams {
  if (!params.filters) return params
  const mapped: FilterState = { ...params.filters }
  for (const [key, map] of Object.entries(maps)) {
    const v = params.filters[key]
    if (v) mapped[key] = map[v] ?? v
  }
  return { ...params, filters: mapped }
}

// ========== 회원 관리 API ==========

export async function fetchAdminUsers(params: FetchParams): Promise<AdminTableResponse<AdminUser>> {
  if (DEMO_MODE) return getMockUsers(mapDemoFilters(params, { status: USER_STATUS_KO_TO_EN, role: USER_ROLE_KO_TO_EN }))

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
  if (DEMO_MODE) return
  await api.patch(`/admin/users/${userId}/role`)
}

// ========== 탈퇴 회원 API ==========

export async function fetchAdminWithdrawals(params: FetchParams): Promise<AdminTableResponse<AdminWithdrawal>> {
  if (DEMO_MODE) return getMockWithdrawals(mapDemoFilters(params, { withdrawalReason: WITHDRAWAL_REASON_KO_TO_EN }))

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
  if (DEMO_MODE) return
  await api.post(`/admin/withdrawals/${userId}/restore`)
}

// ========== 신고 관리 API ==========

export async function fetchAdminReports(
  params: FetchParams,
  targetType?: 'USER' | 'PRODUCT' | 'COMMUNITY_POST',
): Promise<AdminTableResponse<AdminReport>> {
  if (DEMO_MODE) {
    const demoParams = mapDemoFilters(params, { status: REPORT_STATUS_KO_TO_EN })
    const result =
      targetType === 'USER'
        ? getMockUserReports(demoParams)
        : targetType === 'PRODUCT'
          ? getMockProductSellReports(demoParams)
          : getMockCommunityReports(demoParams)
    return {
      ...result,
      data: result.data.map((r) => ({
        ...r,
        status: (REPORT_STATUS_EN_TO_KO[r.status] ?? r.status) as typeof r.status,
      })),
    } as unknown as AdminTableResponse<AdminReport>
  }

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
  const reportData = data.data
  return toAdminTableResponse(
    { ...reportData, content: reportData.content ?? (reportData as any).reports ?? [], totalElements: reportData.totalElements ?? reportData.total },
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
  if (DEMO_MODE) return
  await api.patch(`/admin/reports/${reportId}/review`, body)
}

// ========== 통계 API ==========

export async function fetchMemberStats(): Promise<MemberTrendStat[]> {
  if (DEMO_MODE) return mockMemberStats

  const { data } = await api.get<ApiResponse<MemberTrendStat[]>>('/admin/statistics/trends')
  return data.data
}

export async function fetchWithdrawalReasons(): Promise<WithdrawalReasonStat[]> {
  if (DEMO_MODE) return mockWithdrawalReasons

  const { data } = await api.get<ApiResponse<WithdrawalReasonStat[]>>('/admin/statistics/withdrawal-reasons')
  return data.data
}

// ========== 대시보드 API ==========

export async function fetchDashboardStats(): Promise<DashboardSummary> {
  if (DEMO_MODE)
    return {
      totalUserCount: 1284,
      activeUserCount: 1102,
      withdrawnUserCount: 182,
      totalProductCount: 3471,
      activeProductCount: 2980,
    }

  const { data } = await api.get<ApiResponse<DashboardSummary>>('/admin/statistics/summary')
  return data.data
}
