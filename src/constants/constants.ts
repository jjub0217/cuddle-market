import {
  MessageSquarePlus,
  MessageCircleMore,
  MessageSquareText,
  HeartCrack,
  Tag,
  ShieldAlert,
  Trash2,
  Reply,
  TriangleAlert,
  Check,
  Slash,
  UserRoundX,
  LayoutDashboard,
  Handbag,
  Heart,
  Activity,
  type LucideIcon,
} from 'lucide-react'
import {
  CATEGORY_OPTIONS,
  PET_DETAIL_OPTIONS_BY_TYPE,
  PET_TYPE_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
} from '@cuddle/shared'
import type { ToastType } from '@/types/toast'

// ========== 반려동물 관련 상수 ==========
// 값의 원본은 이제 packages/shared다. 웹·앱이 같은 목록을 쓴다.
// 여기서는 웹 화면이 쓰던 모양({ code, name })으로 맞춰 다시 내보내기만 한다 —
// 화면 파일을 여럿 고치는 것보다 한 곳에서 바꾸는 편이 덜 깨진다.
export const PETS = PET_TYPE_OPTIONS.map((type) => ({
  code: type.code,
  name: type.label,
  details: (PET_DETAIL_OPTIONS_BY_TYPE[type.code] ?? []).map((detail) => ({
    code: detail.code,
    name: detail.label,
  })),
}))

export const PET_TYPE_TABS = [
  { id: 'pet-tab-all', label: '전체', code: 'ALL' },
  { id: 'pet-tab-mammal', label: '포유류', code: 'MAMMAL' },
  { id: 'pet-tab-bird', label: '조류', code: 'BIRD' },
  { id: 'pet-tab-reptile', label: '파충류', code: 'REPTILE' },
  { id: 'pet-tab-fish', label: '수생동물', code: 'FISH' },
  { id: 'pet-tab-amphibian', label: '곤충/절지동물', code: 'AMPHIBIAN' },
  { id: 'pet-tab-amphibian-real', label: '양서류', code: 'AMPHIBIAN_REAL' },
  { id: 'pet-tab-rodent', label: '설치류', code: 'RODENT' },
  { id: 'pet-tab-crustacean', label: '갑각류', code: 'CRUSTACEAN' },
  { id: 'pet-tab-plant', label: '식물/수초', code: 'PLANT' },
  { id: 'pet-tab-etc', label: '기타', code: 'ETC' },
] as const
export type PetTypeTabId = (typeof PET_TYPE_TABS)[number]['id']

export const PET_DETAILS: Array<{ code: string; name: string; categoryCode?: string }> = []
PETS.forEach((category) => {
  category.details.forEach((pet) => {
    PET_DETAILS.push({
      code: pet.code,
      name: pet.name,
    })
  })
})

// ========== 상품 상태 관련 상수 ==========
// 값(코드·이름)의 원본은 shared다. 아래 딸림 설명은 웹 화면에만 있는 것이라 여기 남긴다.
const CONDITION_SUBTITLES: Record<string, string> = {
  NEW: '미사용 상품',
  LIKE_NEW: '사용감 거의 없음',
  USED: '일반적인 사용흔적',
  NEED_REPAIR: '수리 후 사용가능',
}
export const CONDITION_ITEMS: Array<{ value: string; title: string; subtitle: string }> =
  PRODUCT_STATUS_OPTIONS.map((status) => ({
    value: status.code,
    title: status.label,
    subtitle: CONDITION_SUBTITLES[status.code] ?? '',
  }))

// ========== 상품 카테고리 관련 상수 ==========
// 값(코드·이름)의 원본은 shared다. 아이콘 그림은 웹에만 있어 여기서 붙인다.
const CATEGORY_ICON_IMAGES: Record<string, string> = {
  FOOD: '/images/category/food.webp',
  TOY: '/images/category/toy.webp',
  HOUSE: '/images/category/house.webp',
  HEALTH: '/images/category/health.webp',
  CLOTHING: '/images/category/clothing.webp',
  WALKING: '/images/category/walking.webp',
  GROOMING: '/images/category/grooming.webp',
  ETC: '/images/category/etc.webp',
}
export const PRODUCT_CATEGORIES: Array<{ code: string; name: string; iconImage: string }> =
  CATEGORY_OPTIONS.map((category) => ({
    code: category.code,
    name: category.label,
    iconImage: CATEGORY_ICON_IMAGES[category.code] ?? '/images/category/etc.webp',
  }))
export type CategoryFilter = string | null

// ========== 거래상태 관련 상수 ==========
export const STATUS_EN_TO_KO: Array<{ value: string | null; name: string; bgColor: string }> = [
  { value: 'SELLING', name: '판매중', bgColor: 'bg-onsale' },
  { value: 'RESERVED', name: '예약중', bgColor: 'bg-reserved' },
  { value: 'COMPLETED', name: '판매완료', bgColor: 'bg-complete' },
]
export type TransactionStatus = 'SELLING' | 'RESERVED' | 'COMPLETED'

// ========== 탭 관련 상수 ==========
// ⚠️ **「전체」 탭이 없다**(#1109). 예전에는 `{ id: 'tab-all', label: '전체', code: 'ALL' }`
//    이 맨 앞에 있었고 그것이 홈의 기본이었다.
//
//    없앤 까닭 둘:
//    ① 중고거래의 본줄기는 「사는 것」이고 「구해요」는 곁가지다. 기본은 판매가 맞다
//    ② 요청 카드는 썸네일을 안 그려서 판매 카드보다 짧다. 「전체」로 섞어 놓으면
//       그리드 테두리가 들쭉날쭉해 보였다
//
// ⚠️ 기본값은 **두 곳**이 맞물려 정한다. 한쪽만 고치면 탭과 목록이 어긋난다.
//    · 보이는 탭  — `Home.tsx` 의 `initialProductTab` 기본 `'tab-sales'`
//    · 조회 값    — `productQueryKeys.ts` 의 `productType: get('productType') ?? 'SELL'`
export const PRODUCT_TYPE_TABS = [
  { id: 'tab-sales', label: '판매', code: 'SELL' },
  { id: 'tab-purchases', label: '판매요청', code: 'REQUEST' },
] as const
export type ProductTypeTabId = (typeof PRODUCT_TYPE_TABS)[number]['id']

// 마이페이지 용 탭
export const MY_PAGE_TABS = [
  { id: 'tab-sales', label: '판매상품', code: 'SELL' },
  { id: 'tab-purchases', label: '판매요청', code: 'REQUEST' },
  { id: 'tab-wishlist', label: '찜한 상품', code: 'favorites' },
  { id: 'tab-blocked', label: '차단한 사용자', code: 'blocked-users' },
] as const
export type MyPageTabId = (typeof MY_PAGE_TABS)[number]['id']

export const MY_PAGE_NAV = [
  { id: 'nav-dash', label: '대시보드', code: 'DASH_BOARD' },
  { id: 'nav-sales', label: '판매 내역', code: 'SELL' },
  // ⚠️ 문구는 「판매요청 내역」인데 code 는 `PURCHASES` 다. **code 는 고치지 마라** —
  //    `NAV_TO_TAB`(MyPage.tsx)의 열쇠라 바꾸면 메뉴가 아무 데도 안 간다.
  //    이 메뉴가 여는 것은 내가 산 물건이 아니라 **내가 올린 판매요청 글** 목록이다.
  { id: 'nav-purchases', label: '판매요청 내역', code: 'PURCHASES' },
  { id: 'nav-wishlist', label: '찜한 상품', code: 'FAVORITE' },
  { id: 'nav-activity', label: '내 활동', code: 'ACTIVITY' },
  { id: 'nav-blocked', label: '차단한 사용자', code: 'BLOCKED' },
] as const
export type MyPageNavId = (typeof MY_PAGE_NAV)[number]['id']
export type MyPageNavCode = (typeof MY_PAGE_NAV)[number]['code']

// 커뮤니티 용 탭
export const COMMUNITY_TABS = [
  { id: 'tab-question', label: '질문 있어요', code: 'QUESTION' },
  { id: 'tab-info', label: '정보 공유', code: 'INFO' },
] as const
export type CommunityTabId = (typeof COMMUNITY_TABS)[number]['id']

// ========== 가격대 관련 상수 ==========
export const PRICE_TYPE = [
  { value: { min: 0, max: 10000 }, title: '1만원 이하' },
  { value: { min: 10000, max: 50000 }, title: '1만원~5만원' },
  { value: { min: 50000, max: 100000 }, title: '5만원~10만원' },
  { value: { min: 100000, max: null }, title: '10만원 이상' },
]

export interface PriceRange {
  min: number
  max: number | null
}

export interface LocationFilter {
  sido: string | null
  gugun: string | null
}

// ========== 상품상태 관련 상수 ==========
export const SORT_TYPE = [
  { id: 'createdAt', label: '최신순' },
  { id: 'orderedLowPriced', label: '저가순' },
  { id: 'orderedHighPriced', label: '고가순' },
  { id: 'favoriteCount', label: '찜 많은 순' },
]
export type SORT_LABELS = (typeof SORT_TYPE)[number]['label']

export const COMMUNITY_SORT_TYPE = [
  { id: 'latest', label: '최신순' },
  { id: 'views', label: '조회 순' },
  { id: 'comments', label: '댓글 순' },
]

/**
 * 커뮤니티 검색 종류.
 *
 * ⚠️ **아무 데서도 안 쓴다.** 웹도 앱도 늘 `title_content`(제목+내용)로만 찾는다
 *    (`CommunityPage.tsx` 의 `SEARCH_TYPE` 이 그 값으로 못 박혀 있다).
 *
 * 서버는 셋 다 받고 진짜로 돈다(`PostRepositoryCustomImpl.java:56-72`).
 * 그런데 **고르는 자리를 안 뒀다** — 「제목」은 「제목+내용」의 부분집합이고,
 * 「작성자로 찾기」는 프로필 화면이 하는 일이라서다(#857 설계 §2).
 *
 * 이 상수가 남아 있는 탓에 #857 이슈 본문이 「웹은 이걸 쓴다」로 잘못 적혔고,
 * 서버까지 열어보고서야 밝혀졌다. **지우지 않고 남기는 이유**는 서버가 셋을 받는다는
 * 사실 자체가 기록할 값어치가 있어서다 — 필요해지면 웹·앱에 함께 넣는다.
 */
export const COMMUNITY_SEARCH_TYPE = [
  { id: 'title', label: '제목' },
  { id: 'title_content', label: '제목 + 내용' },
  { id: 'writer', label: '작성자' },
]

export const MAX_FILES = 5

// ========== 이미지 처리 관련 상수 ==========
export const IMAGE_PROCESSING_DELAY = 2000 // Lambda 이미지 리사이징 처리 대기 시간 (ms)

// ========== 회원탈퇴 이유 관련 상수 ==========
export const WITHDRAW_REASON = [
  { id: 'SERVICE_DISSATISFACTION', label: '서비스 불만족' },
  { id: 'PRIVACY_CONCERN', label: '개인정보 우려' },
  { id: 'LOW_USAGE', label: '사용 빈도 낮음' },
  { id: 'COMPETITOR', label: '경쟁 서비스 이용' },
  { id: 'OTHER', label: '기타' },
]

// ========== 주의사항 항목들 상수 ==========

// 탈퇴 안내의 원본은 @cuddle/shared에 있다(앱도 같은 것을 쓴다). 여기 있던 목록은
// 서버가 하지 않는 일을 셋이나 약속하고 있어서 사실대로 고치면서 옮겼다(#832).
export { WITH_DRAW_ALERT_LIST } from '@cuddle/shared'

export const PRODUCT_DELETE_ALERT_LIST = ['삭제된 상품은 복구할 수 없습니다']

export const PASSWORD_UPDATE_ALERT_LIST = [
  '영문 대/소문자, 숫자, 특수문자를 조합하세요',
  '개인정보(이름, 생일 등)는 사용하지 마세요',
  '다른 사이트와 같은 비밀번호를 사용하지 마세요',
]

// ========== 신고 사유 · 차단 안내 문구 ==========
// 원본은 @cuddle/shared에 있다(앱도 같은 것을 쓴다). 웹 화면들의 import 경로를
// 안 바꾸려고 여기서 다시 내보낸다. 값을 고칠 일이 있으면 shared에서 고친다.
export { PRODUCT_REPORT_REASON, USER_REPORT_REASON, USER_BLOCK_ALERT_LIST } from '@cuddle/shared'

// 채팅 화면 문구도 원본은 @cuddle/shared에 있다(앱이 같은 것을 쓴다).
export { CHAT_BLOCKED_NOTICE, CHAT_EMPTY_TITLE, CHAT_EMPTY_DESCRIPTION } from '@cuddle/shared'
export type { ReportReason } from '@cuddle/shared'

// 게시글 신고 사유는 여기 있던 POST_REPORT_REASON을 지우고
// @cuddle/shared의 COMMUNITY_REPORT_REASON으로 옮겼다(#812).
// 라벨과 차례는 그대로고, 「기타」가 보내는 값만 OTHER → ETC로 고쳤다 —
// OTHER는 사용자 신고의 값이라 게시글로 보내면 서버가 못 알아봤다.

// ========== 알림 타입 관련 상수 ==========
export const NOTIFICATION_MESSAGES: Record<string, string> = {
  CHAT_NEW_ROOM: '새로운 채팅이 생성되었습니다',
  CHAT_NEW_MESSAGE: '새로운 메시지가 도착했습니다',
  PRODUCT_FAVORITE_STATUS_CHANGED: '찜한 상품의 거래 상태가 변경되었습니다',
  PRODUCT_FAVORITE_PRICE_CHANGED: '찜한 상품의 가격이 변동되었습니다',
  ADMIN_SANCTION: '관리자에 의해 제재를 받았습니다',
  POST_DELETED: '작성한 게시글이 삭제되었습니다',
  COMMENT_REPLY: '댓글에 새로운 답글이 달렸습니다',
  POST_COMMENT: '게시글에 새로운 댓글이 달렸습니다',
}

export const iconMap = {
  CHAT_NEW_ROOM: MessageSquarePlus,
  CHAT_NEW_MESSAGE: MessageCircleMore,
  PRODUCT_FAVORITE_STATUS_CHANGED: HeartCrack,
  PRODUCT_FAVORITE_PRICE_CHANGED: Tag,
  ADMIN_SANCTION: ShieldAlert,
  POST_DELETED: Trash2,
  COMMENT_REPLY: Reply,
  POST_COMMENT: MessageSquareText,
} as const satisfies Record<string, LucideIcon>
export type NotificationType = keyof typeof iconMap

export const myPageIconMap: Record<MyPageNavCode, LucideIcon> = {
  DASH_BOARD: LayoutDashboard,
  SELL: Tag,
  PURCHASES: Handbag,
  FAVORITE: Heart,
  ACTIVITY: Activity,
  BLOCKED: UserRoundX,
}

/** 토스트 기본 설정 */
export const TOAST_DEFAULTS = {
  durationMs: 3000,
  maxVisible: 5,
} as const

/** 타입별 지속 시간 */
export const TOAST_DURATION_BY_TYPE: Record<ToastType, number> = {
  success: 3000,
  error: 5000,
  warning: 4000,
}

/** 타입별 아이콘 */
export const TOAST_ICONS: Record<ToastType, LucideIcon> = {
  success: Check,
  warning: TriangleAlert,
  error: Slash,
}

/** 타입별 색상 스타일 */
export const TOAST_COLORS: Record<ToastType, { box: string; icon: string; text: string; bar: string }> = {
  success: {
    box: 'bg-success-100 border-success-500',
    icon: 'text-success-100',
    text: 'text-success-500',
    bar: 'bg-success-100',
  },
  error: {
    box: 'bg-danger-100 border-danger-500',
    icon: 'fill-danger-500 stroke-white',
    text: 'text-danger-500',
    bar: 'bg-danger-100',
  },
  warning: {
    box: 'bg-primary-100 border-primary-500',
    icon: 'text-primary-500',
    text: 'text-primary-500',
    bar: 'bg-primary-100',
  },
}

/** 타입별 닫기 버튼 스타일 */
export const TOAST_CLOSE_BTN: Record<ToastType, string> = {
  success: 'text-success-500 hover:bg-success-600 hover:text-success-100',
  error: 'text-danger-500 hover:bg-danger-600 hover:text-danger-100',
  warning: 'text-primary-500 hover:bg-primary-600 hover:text-primary-100',
}

/** 토스트 애니메이션 설정 */
export const TOAST_ANIMATION = {
  initial: { opacity: 0, x: 100, y: 100, scale: 0.9 },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: 100,
    scale: 0.9,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
} as const

export const TIME_UNITS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000, // 근사치
  YEAR: 365 * 24 * 60 * 60 * 1000, // 근사치
} as const
