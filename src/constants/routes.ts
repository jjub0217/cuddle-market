import { toUrlName } from '@/lib/utils/toUrlName'

export const ROUTES = {
  HOME: '/',
  MYPAGE: '/mypage',
  DETAIL: `/products/:id`,
  DETAIL_ID: (id: string | number, name?: string) =>
    name ? `/products/${id}/${toUrlName(name)}` : `/products/${id}`,

  // Community
  COMMUNITY: '/community',
  COMMUNITY_POST: '/community-post',
  COMMUNITY_EDIT: '/community/:id/edit',
  COMMUNITY_DETAIL: '/community/:id',
  COMMUNITY_DETAIL_ID: (id: string | number, name?: string) =>
    name ? `/community/${id}/${toUrlName(name)}` : `/community/${id}`,

  // Product
  PRODUCT_POST: '/product-post',
  PRODUCT_EDIT: '/products/:id/edit',

  // Profile
  PROFILE_UPDATE: `/profile-update`,
  USER_PROFILE: '/user-profile/:id',
  USER_ID: (id: string | number) => `/user-profile/${id}`,

  // Chat
  CHAT: '/chat',
  CHAT_ROOM: '/chat/:id',
  CHAT_ROOM_ID: (id: string | number) => `/chat/${id}`,

  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  SOCIAL_SIGNUP: '/auth/social-signup',
  FIND_PASSWORD: '/auth/find-password',

  // Admin Auth
  ADMIN_LOGIN: '/admin/login',

  // Admin
  ADMIN: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  // Admin - Members (2-depth)
  ADMIN_MEMBERS_DASHBOARD: '/admin/members',
  ADMIN_MEMBERS_USERS: '/admin/members/users',
  ADMIN_MEMBERS_WITHDRAWALS: '/admin/members/withdrawals',

  // Admin - Community
  ADMIN_COMMUNITY: '/admin/community',

  // Admin - Reports (2-depth)
  ADMIN_REPORTS_USER: '/admin/reports/user',
  ADMIN_REPORTS_PRODUCT_SELL: '/admin/reports/product-sell',
  ADMIN_REPORTS_PRODUCT_REQUEST: '/admin/reports/product-request',
  ADMIN_REPORTS_COMMUNITY: '/admin/reports/community',
} as const

// 로그인 필수 페이지 목록
export const AUTH_REQUIRED_ROUTES = [ROUTES.MYPAGE, ROUTES.PROFILE_UPDATE, ROUTES.CHAT] as const
