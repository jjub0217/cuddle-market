import { describe, expect, it } from 'vitest'
import { formatChatDate, formatChatTime } from './chatTime'

describe('formatChatTime', () => {
  // 이 저장소가 걸렸던 함정 그대로다. 서버는 시간대 없는 시각을 준다.
  it('시간대가 없는 값도 UTC로 읽는다', () => {
    expect(formatChatTime('2026-08-10T07:12:00')).toBe(formatChatTime('2026-08-10T07:12:00Z'))
  })

  // 실행 기계의 시간대와 무관하게 돌도록, 로컬 시각으로 만든 값을 되돌려 잰다.
  it('오후 시각을 12시간제로 적는다', () => {
    const local = new Date(2026, 7, 10, 13, 5).toISOString()
    expect(formatChatTime(local)).toBe('오후 1:05')
  })

  it('자정은 오전 12시다', () => {
    const local = new Date(2026, 7, 10, 0, 7).toISOString()
    expect(formatChatTime(local)).toBe('오전 12:07')
  })
})

describe('formatChatDate', () => {
  it('요일까지 적는다', () => {
    const local = new Date(2026, 7, 10, 9, 0).toISOString()
    expect(formatChatDate(local)).toBe('2026년 8월 10일 월요일')
  })
})
