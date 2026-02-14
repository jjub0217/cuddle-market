import {
  MessageSquarePlus,
  MessageSquareMore,
  HeartCrack,
  Tag,
  ShieldAlert,
  Trash2,
  Reply,
  MessageCircle,
  TriangleAlert,
  Check,
  Slash,
  type LucideIcon,
} from 'lucide-react'
import type { ToastType } from '@/types/toast'

// ========== 반려동물 관련 상수 ==========
export const PETS = [
  {
    code: 'MAMMAL',
    name: '포유류',
    details: [
      { code: 'DOG', name: '강아지' },
      { code: 'CAT', name: '고양이' },
      { code: 'RABBIT', name: '토끼' },
      { code: 'HAMSTER', name: '햄스터' },
      { code: 'GUINEA_PIG', name: '기니피그' },
      { code: 'FERRET', name: '페럿' },
      { code: 'CHINCHILLA', name: '친칠라' },
      { code: 'HEDGEHOG', name: '고슴도치' },
    ],
  },
  {
    code: 'BIRD',
    name: '조류',
    details: [
      { code: 'BUDGERIGAR', name: '잉꼬' },
      { code: 'PARROT', name: '앵무새' },
      { code: 'CANARY', name: '카나리아' },
      { code: 'LOVEBIRD', name: '모란앵무' },
    ],
  },
  {
    code: 'REPTILE',
    name: '파충류',
    details: [
      { code: 'LIZARD', name: '도마뱀' },
      { code: 'SNAKE', name: '뱀' },
      { code: 'TURTLE', name: '거북이' },
      { code: 'GECKO', name: '게코' },
    ],
  },
  {
    code: 'FISH',
    name: '수생동물',
    details: [
      { code: 'GOLDFISH', name: '금붕어' },
      { code: 'TROPICAL_FISH', name: '열대어' },
      { code: 'CHERRY_SHRIMP', name: '체리새우' },
      { code: 'SNAIL', name: '달팽이' },
    ],
  },
  {
    code: 'AMPHIBIAN',
    name: '양서류',
    details: [
      { code: 'CRICKET', name: '귀뚜라미' },
      { code: 'MANTIS', name: '사마귀' },
      { code: 'BEETLE', name: '딱정벌레' },
      { code: 'SPIDER', name: '거미' },
    ],
  },
] as const

export const PET_TYPE_TABS = [
  { id: 'pet-tab-all', label: '전체', code: 'ALL' },
  { id: 'pet-tab-mammal', label: '포유류', code: 'MAMMAL' },
  { id: 'pet-tab-bird', label: '조류', code: 'BIRD' },
  { id: 'pet-tab-reptile', label: '파충류', code: 'REPTILE' },
  { id: 'pet-tab-fish', label: '수생동물', code: 'FISH' },
  { id: 'pet-tab-amphibian', label: '곤충/절지동물', code: 'AMPHIBIAN' },
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
export const CONDITION_ITEMS: Array<{ value: string; title: string; subtitle: string }> = [
  { value: 'NEW', title: '새 상품', subtitle: '미사용 상품' },
  { value: 'LIKE_NEW', title: '거의 새것', subtitle: '사용감 거의 없음' },
  { value: 'USED', title: '사용감 있음', subtitle: '일반적인 사용흔적' },
  { value: 'NEED_REPAIR', title: '수리 필요', subtitle: '수리 후 사용가능' },
]

// ========== 상품 카테고리 관련 상수 ==========
export const PRODUCT_CATEGORIES = [
  { code: 'FOOD', name: '사료/간식' },
  { code: 'TOY', name: '장난감' },
  { code: 'HOUSE', name: '사육장/하우스' },
  { code: 'HEALTH', name: '건강/위생' },
  { code: 'CLOTHING', name: '의류/악세사리' },
  { code: 'WALKING', name: '이동장/목줄' },
  { code: 'GROOMING', name: '미용용품' },
  { code: 'ETC', name: '기타' },
] as const
export type CategoryFilter = string | null

// ========== 거래상태 관련 상수 ==========
export const STATUS_EN_TO_KO: Array<{ value: string | null; name: string; bgColor: string }> = [
  { value: 'SELLING', name: '판매중', bgColor: 'bg-onsale' },
  { value: 'RESERVED', name: '예약중', bgColor: 'bg-reserved' },
  { value: 'COMPLETED', name: '판매완료', bgColor: 'bg-complete' },
]
export type TransactionStatus = 'SELLING' | 'RESERVED' | 'COMPLETED'

// ========== 탭 관련 상수 ==========
export const PRODUCT_TYPE_TABS = [
  { id: 'tab-all', label: '전체', code: 'ALL' },
  { id: 'tab-sales', label: '판매', code: 'SELL' },
  { id: 'tab-purchases', label: '판매요청', code: 'REQUEST' },
] as const
export type ProductTypeTabId = (typeof PRODUCT_TYPE_TABS)[number]['id']

// 마이페이지 용 탭
export const MY_PAGE_TABS = [
  { id: 'tab-sales', label: '판매상품', code: 'SELL' },
  { id: 'tab-purchases', label: '판매요청', code: 'REQUEST' },
  { id: 'tab-wishlist', label: '찜한 상품', code: 'favorites' },
  { id: 'tab-blocked', label: '차단 유저', code: 'blocked-users' },
] as const
export type MyPageTabId = (typeof MY_PAGE_TABS)[number]['id']

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
  { id: 'orderedLowPriced', label: '가격 낮은순' },
  { id: 'orderedHighPriced', label: '가격 높은순' },
  { id: 'favoriteCount', label: '찜 많은순' },
]
export type SORT_LABELS = (typeof SORT_TYPE)[number]['label']

export const COMMUNITY_SORT_TYPE = [
  { id: 'latest', label: '최신순' },
  { id: 'oldest', label: '오래된 순' },
  { id: 'views', label: '조회 순' },
  { id: 'comments', label: '댓글 순' },
]

export const COMMUNITY_SEARCH_TYPE = [
  { id: 'title', label: '제목' },
  { id: 'title_content', label: '제목 + 내용' },
  { id: 'writer', label: '작성자' },
]

export const MAX_FILES = 5

// ========== 이미지 처리 관련 상수 ==========
export const IMAGE_PROCESSING_DELAY = 2000 // Lambda 이미지 리사이징 처리 대기 시간 (ms)

// ========== 회원탈퇴 이유 관련 상수 ==========
export const WiTH_DRAW_REASON = [
  { id: 'SERVICE_DISSATISFACTION', label: '서비스 불만족' },
  { id: 'PRIVACY_CONCERN', label: '개인정보 우려' },
  { id: 'LOW_USAGE', label: '사용 빈도 낮음' },
  { id: 'COMPETITOR', label: '경쟁 서비스 이용' },
  { id: 'OTHER', label: '기타' },
]

// ========== 주의사항 항목들 상수 ==========

export const WITH_DRAW_ALERT_LIST = [
  '등록한 모든 상품이 삭제됩니다',
  '거래 내역과 채팅 기록이 모두 삭제됩니다',
  '찜한 상품 목록이 삭제됩니다',
  '진행 중인 거래가 있다면 먼저 완료해 주세요',
]
export const PRODUCT_DELETE_ALERT_LIST = ['삭제된 상품은 복구할 수 없습니다']

export const PASSWORD_UPDATE_ALERT_LIST = [
  '영문 대/소문자, 숫자, 특수문자를 조합하세요',
  '개인정보(이름, 생일 등)는 사용하지 마세요',
  '다른 사이트와 같은 비밀번호를 사용하지 마세요',
]

// ========== 회원신고 이유 관련 상수 ==========
export const USER_REPORT_REASON = [
  { id: 'HARASSMENT', label: '욕설, 비방, 괴롭힘' },
  { id: 'FRAUD', label: '사기, 허위 거래 시도' },
  { id: 'INAPPROPRIATE_CONTENT', label: '음란물 또는 불건전 행위' },
  { id: 'SPAM', label: '스팸/광고성 메시지' },
  { id: 'OFFENSIVE_PROFILE', label: '불쾌한 사용자 정보 내용' },
  { id: 'UNDERAGE', label: '만 14세 미만 유저' },
  { id: 'OTHER', label: '기타' },
]

export const USER_BLOCK_ALERT_LIST = [
  '차단한 사용자는 더 이상 채팅을 보내거나 상품을 볼 수 없습니다',
  '해당 사용자의 게시글과 프로필이 숨김 처리됩니다',
  '이미 진행 중인 거래는 영향을 받지 않습니다.',
  `차단은 언제든 '마이페이지 > 차단 목록'에서 해제할 수 있습니다`,
]

// ========== 게시글 이유 관련 상수 ==========
export const POST_REPORT_REASON = [
  { id: 'ABUSE_OR_HATE', label: '욕설, 비방, 혐오 표현' },
  { id: 'REPETITIVE_POST', label: '도배 게시물' },
  { id: 'INAPPROPRIATE_CONTENT', label: '음란물/불건전 콘텐츠' },
  { id: 'SPAM_OR_AD', label: '스팸/광고성 메시지' },
  { id: 'SELF_HARM_OR_SUICIDE', label: '자해 또는 자살 의도를 포함' },
  { id: 'OTHER', label: '기타' },
]

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
  CHAT_NEW_MESSAGE: MessageSquareMore,
  PRODUCT_FAVORITE_STATUS_CHANGED: HeartCrack,
  PRODUCT_FAVORITE_PRICE_CHANGED: Tag,
  ADMIN_SANCTION: ShieldAlert,
  POST_DELETED: Trash2,
  COMMENT_REPLY: Reply,
  POST_COMMENT: MessageCircle,
} as const satisfies Record<string, LucideIcon>
export type NotificationType = keyof typeof iconMap

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
