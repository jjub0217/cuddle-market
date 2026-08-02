import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PasswordChecklist } from './PasswordChecklist'

// 비밀번호 조건 목록. 규칙이 둘이고 각각 통과/미통과가 있다.
//
// 이 조각을 먼저 덮는 이유: 화면에 보이는 것이 props에서 곧장 나와 흔들릴 데가 없다.
// 러너가 제대로 서는지 확인하기에도 좋다.

describe('PasswordChecklist', () => {
  it('입력 전에는 아예 안 보인다', () => {
    const { container } = render(
      <PasswordChecklist checks={{ length: false, composition: false }} visible={false} />
    )

    // 치지도 않았는데 빨간 줄부터 뜨면 혼내는 꼴이라 일부러 감춘다
    expect(container).toBeEmptyDOMElement()
  })

  it('두 조건을 다 보여준다', () => {
    render(<PasswordChecklist checks={{ length: false, composition: false }} visible />)

    expect(screen.getByText('10~30자')).toBeInTheDocument()
    expect(screen.getByText('영문 대소문자·숫자·특수문자 포함')).toBeInTheDocument()
  })

  it('통과한 조건은 「충족」으로 읽힌다', () => {
    render(<PasswordChecklist checks={{ length: true, composition: false }} visible />)

    // ✓/✕ 기호는 aria-hidden이라 화면 낭독기에는 안 들린다.
    // 대신 sr-only 문구가 상태를 말해 준다 — 그게 실제로 붙어 있는지 본다.
    expect(screen.getByText('충족:')).toBeInTheDocument()
    expect(screen.getByText('미충족:')).toBeInTheDocument()
  })

  it('둘 다 통과하면 미충족이 없다', () => {
    render(<PasswordChecklist checks={{ length: true, composition: true }} visible />)

    expect(screen.getAllByText('충족:')).toHaveLength(2)
    expect(screen.queryByText('미충족:')).not.toBeInTheDocument()
  })
})
