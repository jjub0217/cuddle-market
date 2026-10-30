import { describe, expect, it } from 'vitest'

import {
  EVENT_STATUS_FILTERS,
  formatEventPeriod,
  formatEventPlace,
  getSourceName,
  getEventEmptyTitle,
  getEventStatus,
  toEventStatusParam,
  toKoreanDateString,
} from './eventStatus'

// 상태는 서버에 저장하지 않고 화면을 여는 날(한국 날짜) 기준으로 계산한다(설계 7-2절).

describe('행사 상태', () => {
  const TODAY = '2026-10-30'

  it('시작 전이면 남은 날짜', () => {
    expect(getEventStatus('2026-11-08', null, TODAY)).toEqual({ kind: 'upcoming', label: 'D-9' })
    expect(getEventStatus('2026-10-31', '2026-11-02', TODAY)).toEqual({ kind: 'upcoming', label: 'D-1' })
  })

  it('시작일부터 종료일까지 진행 중', () => {
    expect(getEventStatus('2026-10-29', '2026-11-02', TODAY)).toEqual({ kind: 'ongoing', label: '진행 중' })
    expect(getEventStatus('2026-10-30', '2026-11-02', TODAY)).toEqual({ kind: 'ongoing', label: '진행 중' })
    expect(getEventStatus('2026-10-25', '2026-10-30', TODAY)).toEqual({ kind: 'ongoing', label: '진행 중' })
  })

  it('종료일이 없으면 시작일 하루만 진행 중', () => {
    expect(getEventStatus('2026-10-30', null, TODAY)).toEqual({ kind: 'ongoing', label: '진행 중' })
    expect(getEventStatus('2026-10-29', null, TODAY)).toEqual({ kind: 'ended', label: '종료' })
  })

  it('종료일이 지나면 종료', () => {
    expect(getEventStatus('2026-10-20', '2026-10-29', TODAY)).toEqual({ kind: 'ended', label: '종료' })
  })

  it('달이 바뀌어도 날짜 수를 맞게 센다', () => {
    expect(getEventStatus('2027-01-01', null, '2026-12-31')).toEqual({ kind: 'upcoming', label: 'D-1' })
  })
})

describe('한국 날짜', () => {
  it('UTC로 전날 밤 15시 이후면 한국은 다음 날', () => {
    expect(toKoreanDateString(new Date('2026-10-29T15:30:00Z'))).toBe('2026-10-30')
    expect(toKoreanDateString(new Date('2026-10-29T14:59:00Z'))).toBe('2026-10-29')
  })
})

describe('기간 글자', () => {
  it('하루짜리', () => {
    expect(formatEventPeriod('2026-10-31', null)).toBe('2026.10.31 (토)')
    expect(formatEventPeriod('2026-10-31', '2026-10-31')).toBe('2026.10.31 (토)')
  })

  it('여러 날', () => {
    expect(formatEventPeriod('2026-11-06', '2026-11-08')).toBe('2026.11.06 (금) ~ 2026.11.08 (일)')
  })
})

// 행사 소식 목록의 상태 드롭다운. 서버가 거른다(설계 7-2절)
describe('상태 드롭다운', () => {
  it('전체, 예정, 진행 중, 종료 순서', () => {
    expect(EVENT_STATUS_FILTERS.map((filter) => filter.label)).toEqual(['전체', '예정', '진행 중', '종료'])
  })

  it('주소의 값을 서버가 받는 값으로 바꾼다', () => {
    expect(toEventStatusParam('upcoming')).toBe('UPCOMING')
    expect(toEventStatusParam('ongoing')).toBe('ONGOING')
    expect(toEventStatusParam('ended')).toBe('ENDED')
  })

  it('전체이거나 모르는 값이면 보내지 않는다', () => {
    expect(toEventStatusParam('all')).toBeUndefined()
    expect(toEventStatusParam(null)).toBeUndefined()
    expect(toEventStatusParam('WHATEVER')).toBeUndefined()
  })
})

// 상태를 골랐는데 맞는 행사가 없을 때 「행사 소식이 하나도 없다」로 읽히지 않게 한다
describe('걸러 본 결과가 없을 때 문구', () => {
  it('고른 상태를 말한다', () => {
    expect(getEventEmptyTitle('UPCOMING')).toBe('예정된 행사가 없어요')
    expect(getEventEmptyTitle('ONGOING')).toBe('지금 진행 중인 행사가 없어요')
    expect(getEventEmptyTitle('ENDED')).toBe('종료된 행사가 없어요')
  })

  it('전체면 없다(기존 빈 화면 문구를 쓴다)', () => {
    expect(getEventEmptyTitle(undefined)).toBeUndefined()
  })
})

describe('장소 글자', () => {
  it('지역과 장소를 같이', () => {
    expect(formatEventPlace('서울', '문화비축기지')).toBe('서울 문화비축기지')
  })

  it('장소가 이미 시·도로 시작하면 지역을 또 붙이지 않는다', () => {
    expect(formatEventPlace('제주', '제주특별자치도 제주시')).toBe('제주특별자치도 제주시')
  })

  it('하나만 있으면 그것만, 둘 다 없으면 null', () => {
    expect(formatEventPlace(null, '노원 공원')).toBe('노원 공원')
    expect(formatEventPlace('서울', null)).toBe('서울')
    expect(formatEventPlace(null, null)).toBeNull()
  })
})

// 출처 이름은 크롤러가 본문 마지막 줄에 「출처: …」로 쓴다(공공누리 출처 표시)
describe('출처 이름', () => {
  it('본문의 「출처:」 줄에서 읽는다', () => {
    expect(getSourceName('…\n[원문 보기](https://a.kr)\n출처: 서울특별시', 'https://www.seoul.go.kr/x')).toBe('서울특별시')
  })

  it('없으면 원문 주소의 사이트 이름', () => {
    expect(getSourceName('본문', 'https://www.seoul.go.kr/news?x=1')).toBe('www.seoul.go.kr')
    expect(getSourceName('본문', null)).toBeNull()
  })
})
