import { describe, expect, it } from 'vitest'

import { isBottomNavHidden } from './isBottomNavHidden'

// 이 규칙을 **두 곳**이 쓴다 — BottomNav(자기를 그릴지)와 (main)/layout(아래를 비켜 줄지).
//
// 예전에는 두 곳이 각자 목록을 들고 있었고 그것이 어긋나 있었다. 레이아웃 쪽에는
// 로그인·가입 둘뿐이라, 상품 등록처럼 탭바가 없는 화면에서도 56px을 비켜 주고 있었다.
// 「등록」 단추 아래가 통째로 비어 보였다 (2026-08-03 실기기에서 발견).
//
// 여기 시험은 「탭바가 없는 화면 목록」을 못 박는다. 새 화면을 더할 때 한쪽만 고치면
// 여기서 걸린다.

describe('탭바를 숨기는 곳', () => {
  it.each([
    ['/auth/login', '로그인'],
    ['/auth/signup', '가입'],
    ['/auth/find-password', '비밀번호 찾기'],
    ['/product-post', '상품 등록'],
    ['/community-post', '커뮤니티 글쓰기'],
    ['/profile-update', '프로필 수정'],
    ['/notifications', '알림'],
  ])('%s — %s', (path) => {
    expect(isBottomNavHidden(path)).toBe(true)
  })

  it('채팅방에서는 숨긴다', () => {
    expect(isBottomNavHidden('/chat/12')).toBe(true)
  })

  it('상품 수정에서는 숨긴다', () => {
    expect(isBottomNavHidden('/products/36/edit')).toBe(true)
  })

  it('커뮤니티 수정에서는 숨긴다', () => {
    expect(isBottomNavHidden('/community/36/edit')).toBe(true)
  })

  it('댓글 스레드에서는 숨긴다', () => {
    // 하단에 답글 입력칸이 늘 열려 있어 탭바까지 있으면 아래가 두 겹이 된다
    expect(isBottomNavHidden('/community/36/강아지사료/comments/34')).toBe(true)
  })
})

describe('탭바를 두는 곳', () => {
  it.each([
    ['/', '홈'],
    ['/community', '커뮤니티 목록'],
    ['/mypage', '마이'],
    ['/map', '플레이스'],
  ])('%s — %s', (path) => {
    expect(isBottomNavHidden(path)).toBe(false)
  })

  it('상품 상세에서는 둔다', () => {
    // 거기서 다른 탭으로 가는 일이 흔하다
    expect(isBottomNavHidden('/products/36')).toBe(false)
    expect(isBottomNavHidden('/products/36/강아지사료')).toBe(false)
  })

  it('커뮤니티 상세에서는 둔다', () => {
    expect(isBottomNavHidden('/community/36/강아지사료')).toBe(false)
  })

  it('상품 등록과 비슷해 보이는 다른 주소는 안 숨긴다', () => {
    // 목록에 있는 것과 「시작이 같다」는 이유로 걸리면 안 된다
    expect(isBottomNavHidden('/product-post-guide')).toBe(false)
  })
})
