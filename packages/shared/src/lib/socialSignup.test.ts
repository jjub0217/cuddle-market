import { describe, expect, it } from 'vitest'

import { needsSocialSignup } from './socialSignup'

// 소셜로 처음 들어오면 서버가 birthDate·addressSido를 null로 만든다
// (OAuth2UserPersistenceService.createNewUser). 그 둘이 채워졌는지로 판정한다.
//
// 웹 SocialCallback.tsx에 박혀 있던 규칙을 그대로 옮겼다. 두 벌로 두면 갈라진다.

describe('needsSocialSignup', () => {
  it('둘 다 차 있으면 추가 정보가 필요 없다', () => {
    expect(needsSocialSignup({ addressSido: '서울특별시', birthDate: '1988-04-03' })).toBe(false)
  })

  it('지역이 비었으면 필요하다', () => {
    expect(needsSocialSignup({ addressSido: null, birthDate: '1988-04-03' })).toBe(true)
  })

  it('생년월일이 비었으면 필요하다', () => {
    expect(needsSocialSignup({ addressSido: '서울특별시', birthDate: null })).toBe(true)
  })

  it('둘 다 비었으면 필요하다', () => {
    expect(needsSocialSignup({ addressSido: null, birthDate: null })).toBe(true)
  })

  it('빈 글자도 안 채운 것으로 본다 — 서버가 null 대신 빈 글자를 줄 수도 있다', () => {
    expect(needsSocialSignup({ addressSido: '', birthDate: '1988-04-03' })).toBe(true)
    expect(needsSocialSignup({ addressSido: '서울특별시', birthDate: '' })).toBe(true)
  })
})
