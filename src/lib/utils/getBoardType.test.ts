import { describe, expect, it } from 'vitest'

import { getBoardType } from './getBoardType'

describe('게시판 이름', () => {
  it('행사 소식(EVENT)도 이름으로 바꾼다', () => {
    expect(getBoardType('EVENT')).toBe('행사 소식')
  })

  it('기존 게시판 이름은 그대로', () => {
    expect(getBoardType('QUESTION')).toBe('질문 있어요')
    expect(getBoardType('INFO')).toBe('정보 공유')
  })
})
