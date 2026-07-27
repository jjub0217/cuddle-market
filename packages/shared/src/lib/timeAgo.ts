// 상대시간 단위(ms). MONTH/YEAR는 근사치.
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/**
 * 등록 시각을 "3일 전" 같은 상대시간으로 바꾼다.
 * 1년이 넘으면 "2024.03.05" 형태의 날짜로 표시한다.
 *
 * - 서버가 UTC 시각을 타임존 정보 없이 주면 `Z`(UTC)를 붙여 로컬시간으로 오해하지 않게 한다.
 * - 미래 시각(음수 차이)은 '방금 전'으로 방어한다.
 * (웹·앱 공용 단일 원본. 웹 src/lib/utils/getTimeAgo.ts와 동일 규칙.)
 */
export function getTimeAgo(createdAt: string): string {
  const now = new Date()
  const hasTimezone = /Z|[+-]\d{2}:\d{2}/.test(createdAt)
  const created = new Date(hasTimezone ? createdAt : `${createdAt}Z`)
  const diffMs = now.getTime() - created.getTime()

  if (diffMs < 0) return '방금 전'

  const diffMinutes = Math.floor(diffMs / MINUTE)
  const diffHours = Math.floor(diffMs / HOUR)
  const diffDays = Math.floor(diffMs / DAY)
  const diffWeeks = Math.floor(diffMs / WEEK)
  const diffMonths = Math.floor(diffMs / MONTH)
  const diffYears = Math.floor(diffMs / YEAR)

  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${diffWeeks}주 전`
  if (diffYears < 1) return `${diffMonths}개월 전`

  const year = created.getFullYear()
  const month = String(created.getMonth() + 1).padStart(2, '0')
  const day = String(created.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
