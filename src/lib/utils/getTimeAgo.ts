import { TIME_UNITS } from '@/constants/constants'

export const getTimeAgo = (createdAt: string): string => {
  const now = new Date()
  // 서버가 UTC 시간을 타임존 정보 없이 반환하므로, 타임존이 없는 경우 Z(UTC)를 명시
  const hasTimezone = /Z|[+-]\d{2}:\d{2}/.test(createdAt)
  const dateString = hasTimezone ? createdAt : `${createdAt}Z`
  const created = new Date(dateString)
  const diffMs = now.getTime() - created.getTime()

  if (diffMs < 0) {
    return '방금 전'
  }

  const diffMinutes = Math.floor(diffMs / TIME_UNITS.MINUTE)
  const diffHours = Math.floor(diffMs / TIME_UNITS.HOUR)
  const diffDays = Math.floor(diffMs / TIME_UNITS.DAY)
  const diffWeeks = Math.floor(diffMs / TIME_UNITS.WEEK)
  const diffMonths = Math.floor(diffMs / TIME_UNITS.MONTH)
  const diffYears = Math.floor(diffMs / TIME_UNITS.YEAR)

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
