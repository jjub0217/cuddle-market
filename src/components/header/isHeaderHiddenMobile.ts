import { ROUTES } from '@/constants/routes'

// 좁은 화면에서 헤더를 감추는 곳.
//
// 왜 따로 빼 두나: 이 판단을 **두 곳**이 써야 한다(`isBottomNavHidden` 과 같은 이유).
//   1) Header — 자기를 감출지
//   2) (main)/layout — 헤더 높이만큼 위를 비켜 줄지(pt-18)
//
// ⚠️ **예전에는 이 판단이 Header 안에만 있었고, 그것도 자바스크립트로 했다**(#614).
//    서버는 화면 폭을 모르니 `useMediaQuery` 가 늘 「모바일」이라고 답했고, 그래서
//    **데스크탑에서도 첫 그림에는 헤더가 아예 없었다가** 나중에 나타났다.
//    레이아웃은 반대로 늘 72px 을 비워 두었다가 0 으로 줄어 **내용이 위로 점프**했다.
//
//    이제 둘 다 **경로만 보고** 정한다(경로는 서버도 안다). 폭은 CSS(`lg:`)가 가른다.

const HIDE_PATHS: string[] = [ROUTES.NOTIFICATIONS, ROUTES.LOGIN, ROUTES.SIGNUP, ROUTES.COMMUNITY_POST, ROUTES.PRODUCT_POST]

const HIDE_PATTERNS = [
  /^\/community\/\d+\/edit$/, // 커뮤니티 수정
  /^\/products\/\d+\/edit$/, // 상품 수정
  /^\/chat(\/\d+)?$/, // 채팅 목록·채팅방
]

export function isHeaderHiddenMobile(pathname: string): boolean {
  return HIDE_PATHS.includes(pathname) || HIDE_PATTERNS.some((pattern) => pattern.test(pathname))
}
