import { describe, it, expect } from 'vitest'
import { getPetDetailLabel, getCategoryLabel } from './petLabels'

describe('getPetDetailLabel', () => {
  it('펫 세부종류 코드를 한글로 바꾼다', () => {
    expect(getPetDetailLabel('PARROT')).toBe('앵무새')
    expect(getPetDetailLabel('DOG')).toBe('강아지')
    expect(getPetDetailLabel('AXOLOTL')).toBe('우파루파')
  })

  it('모르는 코드는 그대로 돌려준다', () => {
    expect(getPetDetailLabel('DRAGON')).toBe('DRAGON')
  })
})

describe('getCategoryLabel', () => {
  it('카테고리 코드를 한글로 바꾼다', () => {
    expect(getCategoryLabel('FOOD')).toBe('사료/간식')
    expect(getCategoryLabel('WALKING')).toBe('외출용품')
  })

  it('모르는 코드는 그대로 돌려준다', () => {
    expect(getCategoryLabel('SPACE')).toBe('SPACE')
  })
})
