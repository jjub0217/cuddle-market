import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import Header from './Header'
import { HEADER_ICON_BUTTON_SIZE } from './headerIconButtonSize'

// 헤더에 **나란히 놓인 아이콘 단추가 같은 크기 값을 쓰는지**만 지킨다(#1000).
//
// 예전에는 검색(돋보기)이 `IconButton` 의 기본값 md, 알림(종)만 lg 를 써서
// 좁은 폭에서 종을 담은 상자만 4px 컸다. 값을 한 곳(`headerIconButtonSize.ts`)에서
// 정하게 바꿨으니, 누가 한쪽만 다시 고치면 여기서 걸린다.
//
// ⚠️ **jsdom 에는 배치가 없다.** 여기서 볼 수 있는 것은 클래스 이름(`p-2` 같은 것)까지다.
//    「진짜 화면에서 같은 크기로 보이는가」·「여백이 눈에 맞는가」는 못 본다 —
//    그것은 브라우저에서 폭을 줄여 눈으로 봐야 한다.
//
// ⚠️ 시험 환경의 `matchMedia` 는 늘 `matches: false` 다(vitest.setup.ts).
//    그래서 `useMediaQuery` 를 쓰는 조각은 모두 **넓은 폭 가지**로 그려진다.
//    UserMenu 가 아바타 대신 햄버거를 내놓는 것도 그 때문이다.
//    폭에 따라 갈리는 아이콘 크기(종 24/20)는 여기서 못 가른다.

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('@/store/userStore', () => ({
  useUserStore: (selector?: (state: unknown) => unknown) => {
    const state = {
      user: { id: 1, nickname: '테스터', profileImageUrl: '' },
      _hasHydrated: true,
      isLogin: () => true,
      clearAll: vi.fn(),
    }
    return selector ? selector(state) : state
  },
}))

vi.mock('@/hooks/useNotifications', () => ({ useNotificationSSE: () => {} }))
vi.mock('@/hooks/useLogout', () => ({ useLogout: () => ({ openLogoutConfirm: vi.fn() }) }))
vi.mock('@/lib/api/graphql', () => ({
  fetchGraphQL: vi.fn().mockResolvedValue({ unreadNotificationCount: { unreadCount: 0 } }),
}))

// 전체화면 오버레이는 닫혀 있어도 무거운 것들(무한 스크롤·SSE·초점 가둠)을 끌고 온다.
// 이 시험이 보려는 것은 헤더 한 줄뿐이라 껍데기로 바꿔 둔다.
vi.mock('@/components/header/components/MobileSearchOverlay', () => ({ default: () => null }))
vi.mock('@/components/header/components/MobileNavigation', () => ({ default: () => null }))
vi.mock('@/components/header/components/MobileNotificationsOverlay', () => ({ default: () => null }))

/** `IconButton` 이 크기마다 붙이는 안쪽 여백 클래스 */
const 크기별클래스 = { sm: 'p-1', md: 'p-1.5', lg: 'p-2' }

describe('헤더 아이콘 단추 크기 (#1000)', () => {
  it('검색·알림·메뉴가 모두 같은 크기 클래스를 쓴다', () => {
    render(<Header />)

    const 단추들 = ['검색', '알림', '메뉴'].map((이름) => screen.getByRole('button', { name: 이름 }))

    const 여백들 = 단추들.map(
      (단추) => Object.values(크기별클래스).find((클래스) => 단추.className.split(' ').includes(클래스)) ?? '(없음)'
    )

    // 셋이 같은 값 하나만 쓴다
    expect(new Set(여백들).size).toBe(1)
    // 그 값이 한 곳에서 정한 크기다
    expect(여백들[0]).toBe(크기별클래스[HEADER_ICON_BUTTON_SIZE])
  })
})
