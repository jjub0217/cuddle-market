import { ROUTES } from '@/constants/routes'

// 하단 탭바를 숨기는 곳.
//
// 왜 따로 빼 두나: 이 판단을 **두 곳**이 써야 한다.
//   1) BottomNav — 자기를 그릴지
//   2) (main)/layout — 탭바 높이만큼 아래를 비켜 줄지(pb-14)
//
// 예전에는 두 곳이 각자 목록을 들고 있었고, 그 목록이 어긋나 있었다. 레이아웃 쪽에는
// 로그인·가입 둘뿐이라 **상품 등록·글쓰기·채팅방 등 여덟 곳 넘게** 탭바가 없는데도
// 56px을 비켜 주고 있었다 — 화면 아래가 통째로 비어 보였다(2026-08-03 실기기에서 발견).

const HIDE_PATHS: string[] = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
  ROUTES.FIND_PASSWORD,
  ROUTES.PRODUCT_POST,
  ROUTES.COMMUNITY_POST,
  ROUTES.PROFILE_UPDATE,
  ROUTES.NOTIFICATIONS,
  ROUTES.CHAT,
]

const HIDE_PATTERNS = [
  /^\/chat\/\d+$/, // 채팅방
  // 커뮤니티 댓글 스레드 — 하단에 답글 입력칸이 늘 열려 있어 탭바까지 있으면 아래가 두 겹이 된다.
  // 답글에 집중하는 화면이라 앱도 탭바를 안 띄운다(10바퀴). 당근도 같다.
  /^\/community\/\d+\/[^/]+\/comments\/\d+$/,
  /^\/community\/\d+\/edit$/, // 커뮤니티 수정
  /^\/products\/\d+\/edit$/, // 상품 수정
]

// 「커뮤니티 상세(/community/{id})」 규칙은 뺐다. 그 주소는 slug가 붙은 곳으로
// redirect만 하고 화면을 안 그려서 한 번도 안 걸렸다. 그리고 상세에서는 탭바를
// 두는 게 맞다 — 거기서 다른 탭으로 가는 일이 흔하다.

export function isBottomNavHidden(pathname: string): boolean {
  return HIDE_PATHS.includes(pathname) || HIDE_PATTERNS.some((pattern) => pattern.test(pathname))
}
