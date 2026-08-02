import { describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import ProfileData, { type MyPageData } from './ProfileData'

// 소개글 자리. 내 프로필과 남의 프로필에서 다르게 보여야 한다 (#810).
//
// 비어 있을 때 「소개글을 작성해주세요」는 내 프로필용 안내다. 남의 프로필에서 뜨면
// 보는 사람은 누구더러 쓰라는 건지 알 수 없다.

// next/navigation은 실제 라우터가 있어야 돌아간다. 이 시험은 소개글만 보므로 가짜로 둔다.
vi.mock('next/navigation', () => ({
  usePathname: () => '/user-profile/7',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

const BASE: MyPageData = {
  id: 7,
  nickname: '협주',
  addressSido: '경기',
  addressGugun: '파주시',
  createdAt: '2026-01-01T00:00:00',
}

const EMPTY_INTRO_NOTICE = '소개글을 작성해주세요'

describe('소개글', () => {
  it('남의 프로필이고 소개글이 없으면 줄을 아예 안 그린다', () => {
    render(<ProfileData data={BASE} isMyProfile={false} />)

    expect(screen.queryByText(EMPTY_INTRO_NOTICE)).not.toBeInTheDocument()
  })

  it('내 프로필이고 소개글이 없으면 쓰라고 안내한다', () => {
    render(<ProfileData data={BASE} isMyProfile />)

    expect(screen.getByText(EMPTY_INTRO_NOTICE)).toBeInTheDocument()
  })

  it('남의 프로필이어도 소개글이 있으면 보여준다', () => {
    render(<ProfileData data={{ ...BASE, introduction: '강아지 둘 키웁니다' }} isMyProfile={false} />)

    expect(screen.getByText('강아지 둘 키웁니다')).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_INTRO_NOTICE)).not.toBeInTheDocument()
  })

  it('내 프로필에 소개글이 있으면 안내 대신 소개글이 보인다', () => {
    render(<ProfileData data={{ ...BASE, introduction: '고양이 집사' }} isMyProfile />)

    expect(screen.getByText('고양이 집사')).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_INTRO_NOTICE)).not.toBeInTheDocument()
  })
})
