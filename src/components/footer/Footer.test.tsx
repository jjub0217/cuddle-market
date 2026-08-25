import { describe, expect, it } from 'vitest'

import { render, screen } from '@/test/render'

import Footer from './Footer'

// 푸터의 **이용약관 링크**만 지킨다(#803).
//
// 왜 이것만 시험하는가: 이 링크는 취향이 아니라 **법이 요구하는 것**이다.
// 전자상거래법 제10조 제1항이 사이버몰 운영자에게 이용약관을 초기화면에 표시하도록
// 정하고(연결 화면으로 갈음 가능), 어기면 과태료가 500만원까지 간다.
// 2025년 3월 당근마켓이 같은 조항으로 시정명령과 과태료를 받았다.
// 푸터를 손보다 링크가 빠지면 **조용히 위반 상태로 돌아간다** — 그것을 막는 시험이다.
//
// ⚠️ 「보이는가」가 아니라 **「어디로 가는가」**를 본다. 푸터는 `hidden md:block` 이라
//    jsdom 에서는 어차피 배치를 못 잰다(CLAUDE.md 「웹 시험이 못 보는 것」).
//    글자만 보면 링크가 엉뚱한 데로 가도 통과하므로 href 를 직접 확인한다.

describe('Footer 안내 문서 링크', () => {
  it('이용약관 링크가 /terms 로 간다', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms')
  })

  it('개인정보처리방침·계정 삭제 안내도 함께 있다', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: '계정 삭제 안내' })).toHaveAttribute(
      'href',
      '/account-deletion',
    )
  })
})
