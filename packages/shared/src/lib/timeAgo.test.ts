import { describe, it, expect, vi, afterEach } from 'vitest'
import { getTimeAgo } from './timeAgo'

// "지금"을 고정해야 상대시간 결과가 흔들리지 않는다.
function freezeNow(iso: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(iso))
}

afterEach(() => {
  vi.useRealTimers()
})

describe('getTimeAgo', () => {
  it('1분 미만은 방금 전', () => {
    freezeNow('2026-07-23T12:00:00Z')
    expect(getTimeAgo('2026-07-23T11:59:30Z')).toBe('방금 전')
  })

  it('분·시간·일 단위로 끊어 표시한다', () => {
    freezeNow('2026-07-23T12:00:00Z')
    expect(getTimeAgo('2026-07-23T11:30:00Z')).toBe('30분 전')
    expect(getTimeAgo('2026-07-23T09:00:00Z')).toBe('3시간 전')
    expect(getTimeAgo('2026-07-20T12:00:00Z')).toBe('3일 전')
  })

  it('1년이 넘으면 날짜로 표시한다', () => {
    freezeNow('2026-07-23T12:00:00Z')
    expect(getTimeAgo('2024-03-05T12:00:00Z')).toBe('2024.03.05')
  })
})
