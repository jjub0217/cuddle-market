import { afterEach, describe, expect, it, vi } from 'vitest'

import { render, screen } from '@/test/render'

import ProfileData, { type MyPageData } from './ProfileData'

// 소개글 자리. 내 프로필과 남의 프로필에서 다르게 보여야 한다 (#810).
//
// 비어 있을 때 「소개글을 작성해주세요」는 내 프로필용 안내다. 남의 프로필에서 뜨면
// 보는 사람은 누구더러 쓰라는 건지 알 수 없다.

// next/navigation은 실제 라우터가 있어야 돌아간다. 가짜로 둔다.
// ⚠️ 경로는 시험마다 바꿀 수 있게 변수로 뺀다 — 이 조각이 `/profile-update` 인지 보고
//    이메일 줄을 그릴지 가르기 때문이다(아래 「이메일」 묶음).
let 지금경로 = '/user-profile/7'
vi.mock('next/navigation', () => ({
  usePathname: () => 지금경로,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

afterEach(() => {
  지금경로 = '/user-profile/7'
})

const BASE: MyPageData = {
  id: 7,
  nickname: '협주',
  addressSido: '경기',
  addressGugun: '파주시',
  createdAt: '2026-01-01T00:00:00',
}

const EMPTY_INTRO_NOTICE = '소개글을 작성해주세요'
/** 남의 프로필에서는 「작성해주세요」가 아니라 사실을 적는다 — 누구더러 쓰라는 건지 알 수 없다 */
const EMPTY_INTRO_OTHER = '소개글이 없습니다'

describe('소개글', () => {
  it('남의 프로필이고 소개글이 없으면 줄을 아예 안 그린다', () => {
    render(<ProfileData data={BASE} isMyProfile={false} />)

    // ⚠️ 남에게 「작성해주세요」라고 하지 않는다. 대신 사실을 적는다
    expect(screen.queryByText(EMPTY_INTRO_NOTICE)).not.toBeInTheDocument()
    expect(screen.getByText(EMPTY_INTRO_OTHER)).toBeInTheDocument()
  })

  it('내 프로필이고 소개글이 없으면 쓰라고 안내한다', () => {
    render(<ProfileData data={BASE} isMyProfile />)

    expect(screen.getByText(EMPTY_INTRO_NOTICE)).toBeInTheDocument()
  })

  it('남의 프로필이어도 소개글이 있으면 보여준다', () => {
    render(<ProfileData data={{ ...BASE, introduction: '강아지 둘 키웁니다' }} isMyProfile={false} />)

    expect(screen.getByText('강아지 둘 키웁니다')).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_INTRO_NOTICE)).not.toBeInTheDocument()
    expect(screen.queryByText(EMPTY_INTRO_OTHER)).not.toBeInTheDocument()
  })

  it('내 프로필에 소개글이 있으면 안내 대신 소개글이 보인다', () => {
    render(<ProfileData data={{ ...BASE, introduction: '고양이 집사' }} isMyProfile />)

    expect(screen.getByText('고양이 집사')).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_INTRO_NOTICE)).not.toBeInTheDocument()
  })
})

describe('빈 소개글', () => {
  // 소개글은 저장할 때 앞뒤 공백을 안 뗀다. 최소 2자만 보므로(authValidationRules)
  // 공백 두 칸도 저장된다. 그걸 그대로 그리면 남의 프로필에 빈 줄이 생긴다.

  it('빈 문자열은 없는 것과 같다 — 내 프로필이면 안내가 뜬다', () => {
    render(<ProfileData data={{ ...BASE, introduction: '' }} isMyProfile />)

    expect(screen.getByText(EMPTY_INTRO_NOTICE)).toBeInTheDocument()
  })

  it('빈 문자열은 없는 것과 같다 — 남의 프로필이면 「소개글이 없습니다」', () => {
    render(<ProfileData data={{ ...BASE, introduction: '' }} isMyProfile={false} />)

    expect(screen.getByText(EMPTY_INTRO_OTHER)).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_INTRO_NOTICE)).not.toBeInTheDocument()
  })

  it('공백만 있는 소개글도 없는 것과 같다 — 내 프로필', () => {
    render(<ProfileData data={{ ...BASE, introduction: '   ' }} isMyProfile />)

    expect(screen.getByText(EMPTY_INTRO_NOTICE)).toBeInTheDocument()
  })

  it('공백만 있는 소개글도 없는 것과 같다 — 남의 프로필은 「소개글이 없습니다」', () => {
    // 예전에는 빈 줄조차 안 그렸다. 지금은 문구가 갈려서 남의 프로필에도 안내가 뜬다 —
    // 「소개글이 없습니다」는 사실을 적는 것이라 남에게 보여도 어색하지 않다.
    render(<ProfileData data={{ ...BASE, introduction: '   ' }} isMyProfile={false} />)

    expect(screen.getByText(EMPTY_INTRO_OTHER)).toBeInTheDocument()
    expect(screen.queryByText(EMPTY_INTRO_NOTICE)).not.toBeInTheDocument()
  })

  it('앞뒤 공백은 떼고 보여준다', () => {
    render(<ProfileData data={{ ...BASE, introduction: '  강아지 둘 키웁니다  ' }} isMyProfile={false} />)

    expect(screen.getByText('강아지 둘 키웁니다')).toBeInTheDocument()
  })
})

describe('이메일', () => {
  // 데스크탑 웹에만 이메일을 볼 곳이 없었다. 모바일 웹은 폼 안(계정 정보 묶음),
  // 앱은 프로필 수정 화면에 있는데 데스크탑만 빠져 있었다.
  // 「데스크탑에서는 사이드바에 표시」라는 주석과 email 프로퍼티까지 있는데 안 그렸다 —
  // 정한 것이 아니라 옮기다 만 것이었다.
  //
  // ⚠️ 소셜 로그인이 섞여 있어 「내가 어느 이메일로 가입했나」가 실제 질문이다.
  //    비밀번호를 찾을 때도 고객센터에 물을 때도 필요하다.

  const 내정보: MyPageData = { ...BASE, email: 'devel.jjub@gmail.com' }

  it('내 프로필에는 이메일이 보인다', () => {
    render(<ProfileData data={내정보} isMyProfile />)

    expect(screen.getByText('devel.jjub@gmail.com')).toBeInTheDocument()
  })

  it('⚠️ 남의 프로필에는 이메일이 **안** 보인다', () => {
    // 이 시험이 유일한 벽이다. 서버가 남의 프로필 응답에도 이메일을 실어 보내고 있어
    // (UserProfileResponse.java:57) 데이터는 이미 브라우저에 와 있다.
    // isMyProfile 조건을 지우면 남의 이메일이 그대로 화면에 뜬다.
    render(<ProfileData data={내정보} isMyProfile={false} />)

    expect(screen.queryByText('devel.jjub@gmail.com')).not.toBeInTheDocument()
  })

  it('⚠️ 프로필 수정 화면에서는 옆 칸에 **안** 보인다', () => {
    // 그 화면은 폼 안에 이메일 칸이 따로 있다(ProfileUpdateBaseForm).
    // 옆 칸에도 그리면 한 화면에 같은 값이 두 번 나온다
    지금경로 = '/profile-update'

    render(<ProfileData data={내정보} isMyProfile />)

    expect(screen.queryByText('devel.jjub@gmail.com')).not.toBeInTheDocument()
  })

  it('마이페이지 옆 칸에는 보인다', () => {
    // 거기엔 폼이 없어 옆 칸이 이메일을 볼 수 있는 유일한 자리다
    지금경로 = '/mypage'

    render(<ProfileData data={내정보} isMyProfile />)

    expect(screen.getByText('devel.jjub@gmail.com')).toBeInTheDocument()
  })

  it('이메일이 없으면 줄 자체를 안 그린다', () => {
    // 소셜로 갓 들어온 사람 등. 빈 칸을 그리면 「고장났나」로 보인다
    render(<ProfileData data={BASE} isMyProfile />)

    expect(screen.queryByText('이메일')).not.toBeInTheDocument()
  })
})

describe('가입일', () => {
  // 중고거래에서 가입일은 **신뢰 신호**다 — 「3년 된 사람」과 「어제 가입한 사람」은
  // 거래를 결정할 때 다르게 읽힌다. 그래서 값어치가 있는 자리는 **남의 프로필**이다.
  //
  // ⚠️ 예전에는 거꾸로였다. 프로필 수정(데스크탑)에만 보이고 남의 프로필에는 없었다.
  //    프로필 수정은 고치러 오는 화면이라 가입일이 답할 질문 자체가 없다.

  it('넘겨받으면 보여준다', () => {
    // ⚠️ 「가입일 ↔ 2026.01.01」이 아니라 **한 줄로 이어 쓴다.** 이름표·구분선을 두면
    //    설정 화면 항목처럼 보인다 — 한 줄뿐인데 그 짜임을 쓰면 떠 보인다
    render(<ProfileData data={BASE} isMyProfile={false} showJoinDate />)

    // 생년월일과 같은 모양이다(@cuddle/shared 의 formatJoinDate)
    expect(screen.getByText('2026.01.01 가입')).toBeInTheDocument()
  })

  it('안 넘기면 안 보인다', () => {
    // 프로필 수정 화면이 이쪽이다
    render(<ProfileData data={BASE} isMyProfile={false} />)

    expect(screen.queryByText(/가입/)).not.toBeInTheDocument()
  })

  it('가입일 값이 없으면 넘겨받아도 안 그린다', () => {
    // 빈 줄을 그리면 「고장났나」로 보인다
    render(<ProfileData data={{ ...BASE, createdAt: '' }} isMyProfile={false} showJoinDate />)

    expect(screen.queryByText(/가입/)).not.toBeInTheDocument()
  })
})
