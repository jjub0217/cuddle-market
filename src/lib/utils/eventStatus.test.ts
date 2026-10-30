import { describe, expect, it } from 'vitest'

import { formatEventPeriod, getEventStatus, toKoreanDateString } from './eventStatus'

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
