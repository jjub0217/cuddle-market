export const ROUTES = {
  HOME: '/',
  MYPAGE: '/mypage',
  DETAIL: `/products/:id`,
  DETAIL_ID: (id: string | number) => `/products/${id}`,

  // Community
  COMMUNITY: '/community',
  COMMUNITY_POST: '/community-post',
  COMMUNITY_EDIT: '/community/:id/edit',
  COMMUNITY_DETAIL: '/community/:id',
  COMMUNITY_DETAIL_ID: (id: string | number) => `/community/${id}`,

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
} as const
