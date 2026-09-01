import { describe, it, expect } from 'vitest'
import { formatBirthDate, formatJoinDate, formatPrice, getPriceLabel, isTradeAvailable } from './format'

describe('formatPrice', () => {
  it("천 단위 콤마만 붙이고 '원'은 붙이지 않는다", () => {
    expect(formatPrice(1000)).toBe('1,000')
    expect(formatPrice(0)).toBe('0')
    expect(formatPrice(2000000)).toBe('2,000,000')
  })

  it('소수점은 버린다', () => {
    expect(formatPrice(1000.9)).toBe('1,000')
  })
})

describe('isTradeAvailable', () => {
  it('판매중(SELLING)이거나 null이면 true', () => {
    expect(isTradeAvailable('SELLING')).toBe(true)
    expect(isTradeAvailable(null)).toBe(true)
  })
  it('예약중(RESERVED)·완료(COMPLETED)면 false', () => {
    expect(isTradeAvailable('RESERVED')).toBe(false)
    expect(isTradeAvailable('COMPLETED')).toBe(false)
  })
})

describe('formatBirthDate', () => {
  it('점으로 잇는다 — 가입일(ProfileData.formatJoinDate)과 같은 모양', () => {
    // 데스크탑 프로필 수정에서 생년월일(폼)과 가입일(옆 칸)이 한 화면에 같이 보인다.
    // 모양이 다르면 바로 눈에 띈다
    expect(formatBirthDate('2000-03-07')).toBe('2000.03.07')
  })

  it('값이 없으면 빈 글자', () => {
    // 소셜로 갓 들어온 사람은 생년월일이 없다. 호출부가 이 빈 값을 보고 줄을 안 그린다
    expect(formatBirthDate()).toBe('')
    expect(formatBirthDate('')).toBe('')
  })

  it('앞의 0을 지우지 않는다', () => {
    // toLocaleDateString('ko-KR')은 "2000. 3. 7."로 0을 지우고 끝점을 붙인다.
    // 여기서는 자릿수를 고정한다 — 값이 여럿 나란히 놓일 때 폭이 들쭉날쭉하지 않다
    expect(formatBirthDate('1996-02-05')).toBe('1996.02.05')
  })
})

describe('formatJoinDate', () => {
  it('시각을 떼고 날짜만 점으로 잇는다', () => {
    // 서버는 LocalDateTime 을 준다(UserProfileResponse.java:26). 가입한 시각은 궁금하지 않다
    expect(formatJoinDate('2023-04-12T10:30:00')).toBe('2023.04.12')
  })

  it('값이 없거나 날짜가 아니면 빈 글자', () => {
    expect(formatJoinDate()).toBe('')
    expect(formatJoinDate('')).toBe('')
    expect(formatJoinDate('말도 안 되는 값')).toBe('')
  })

  it('생년월일과 같은 모양이다', () => {
    // 프로필에서 두 날짜가 같이 보인다. 모양이 갈리면 바로 눈에 띈다
    expect(formatJoinDate('2000-03-07T00:00:00')).toBe(formatBirthDate('2000-03-07'))
  })
})

describe('getPriceLabel', () => {
  it('판매요청이면 「희망」을 준다', () => {
    expect(getPriceLabel('REQUEST')).toBe('희망')
  })

  it('빈칸을 붙이지 않는다', () => {
    // 사이 띄우기는 그리는 쪽이 여백으로 준다 — 값에 이어 붙이는 글이 아니라
    // 작고 연하게 따로 그리는 라벨이기 때문이다
    expect(getPriceLabel('REQUEST')).not.toMatch(/\s/)
  })

  it('판매면 null 이라 아무것도 안 그린다', () => {
    expect(getPriceLabel('SELL')).toBeNull()
  })

  it('값이 없어도 null', () => {
    expect(getPriceLabel()).toBeNull()
    expect(getPriceLabel(null)).toBeNull()
  })

  it('모르는 코드는 판매로 본다', () => {
    // 서버가 갈래를 늘려도 「희망」이 엉뚱한 곳에 붙지는 않는다
    expect(getPriceLabel('AUCTION')).toBeNull()
  })
})
