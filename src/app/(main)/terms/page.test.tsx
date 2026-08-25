import { describe, expect, it } from 'vitest'

import { render, screen } from '@/test/render'

import TermsPage from './page'

// 이용약관 페이지가 **그려지는가**와, 법이 걸린 두 조가 실제로 글로 나오는가만 지킨다(#803).
//
// 왜 「그려지는가」부터 보는가: 이 저장소는 `return (` 바로 뒤에 주석을 두어 화면이
// 통째로 안 그려진 적이 네 번 있다. 타입체크는 그것을 못 잡는다.
//
// 왜 하필 제7조·제9조인가: 나머지 조문은 문구를 다듬어도 되지만 이 둘은 근거가 법이다.
//   제7조 — 전자상거래법 제20조 제1항의 「나는 거래 당사자가 아니다」 고지.
//           빠뜨리면 제20조의2 제1항에 따라 **파는 사람의 잘못까지 연대 배상**하게 된다.
//   제9조 — 동물보호법상 동물판매업은 허가제라(무허가 2년 이하 징역) 살아 있는 동물
//           거래를 막아 둔 자리다.
//
// ⚠️ 문구가 아니라 **조문 제목**을 본다. 본문 표현은 다듬을 수 있어야 하지만
//    「이 조가 있는가」는 지켜야 하기 때문이다.

describe('이용약관 페이지', () => {
  it('화면이 그려지고 제목이 보인다', () => {
    render(<TermsPage />)

    expect(screen.getByRole('heading', { level: 1, name: '이용약관' })).toBeInTheDocument()
  })

  it('거래 당사자가 아니라는 고지(제7조)가 있다', () => {
    render(<TermsPage />)

    expect(
      screen.getByRole('heading', { name: /제7조 \(커들마켓의 지위/ }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/통신판매중개자이며, 거래의 당사자가 아닙니다/),
    ).toBeInTheDocument()
  })

  it('살아 있는 동물을 올릴 수 없다는 조(제9조)가 있다', () => {
    render(<TermsPage />)

    expect(screen.getByRole('heading', { name: '제9조 (올릴 수 없는 물건)' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '살아 있는 동물' })).toBeInTheDocument()
  })

  it('개인정보처리방침·계정 삭제 안내로 이어진다', () => {
    render(<TermsPage />)

    expect(screen.getAllByRole('link', { name: '개인정보처리방침' })[0]).toHaveAttribute(
      'href',
      '/privacy',
    )
    expect(screen.getByRole('link', { name: '계정 삭제 안내' })).toHaveAttribute(
      'href',
      '/account-deletion',
    )
  })
})
