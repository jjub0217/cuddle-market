/**
 * 행사 소식의 상태와 기간 글자(설계 7-2절).
 *
 * 상태는 서버에 저장하지 않고 화면을 여는 날 기준으로 계산한다. 저장하면 날마다 바꿔 줘야 한다.
 * 날짜는 모두 'YYYY-MM-DD' 글자로 다룬다 — Date 로 바꾸면 보는 사람의 시간대에 따라 하루가 밀린다.
 */

export type EventStatusKind = 'upcoming' | 'ongoing' | 'ended'

export interface EventStatus {
  kind: EventStatusKind
  label: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 'YYYY-MM-DD' 를 UTC 자정의 밀리초로. 날짜끼리 빼서 날 수를 셀 때만 쓴다 */
const toUtcMs = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** 지금이 한국에서 며칠인지. 서버도 브라우저도 시간대와 상관없이 같은 답을 낸다 */
export function toKoreanDateString(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function getEventStatus(startDate: string, endDate: string | null, today: string): EventStatus {
  const end = endDate ?? startDate
  if (today < startDate) {
    const days = Math.round((toUtcMs(startDate) - toUtcMs(today)) / DAY_MS)
    return { kind: 'upcoming', label: `D-${days}` }
  }
  if (today <= end) return { kind: 'ongoing', label: '진행 중' }
  return { kind: 'ended', label: '종료' }
}

const formatDay = (date: string) => {
  const [y, m, d] = date.split('-')
  const weekday = WEEKDAYS[new Date(toUtcMs(date)).getUTCDay()]
  return `${y}.${m}.${d} (${weekday})`
}

/** '2026.10.31 (토)' 또는 '2026.11.06 (금) ~ 2026.11.08 (일)' — 크롤러가 본문에 쓰는 모양과 같다 */
export function formatEventPeriod(startDate: string, endDate: string | null): string {
  if (!endDate || endDate === startDate) return formatDay(startDate)
  return `${formatDay(startDate)} ~ ${formatDay(endDate)}`
}

/**
 * 행사 소식 목록의 상태 드롭다운 선택지. value 는 주소(?eventStatus=)에 남는 값이다.
 * 걸러 내기는 서버가 한다 — 화면에서 거르면 10개씩 받는 페이지가 어긋난다(설계 7-2절).
 */
export const EVENT_STATUS_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'upcoming', label: '예정' },
  { value: 'ongoing', label: '진행 중' },
  { value: 'ended', label: '종료' },
] as const

const EVENT_STATUS_PARAMS: Record<string, 'UPCOMING' | 'ONGOING' | 'ENDED'> = {
  upcoming: 'UPCOMING',
  ongoing: 'ONGOING',
  ended: 'ENDED',
}

/** 주소의 값을 서버가 받는 값(EventPeriodStatus)으로. 전체이거나 모르는 값이면 보내지 않는다 */
export function toEventStatusParam(value: string | null | undefined) {
  return value ? EVENT_STATUS_PARAMS[value] : undefined
}

const EVENT_EMPTY_TITLES: Record<'UPCOMING' | 'ONGOING' | 'ENDED', string> = {
  UPCOMING: '예정된 행사가 없어요',
  ONGOING: '지금 진행 중인 행사가 없어요',
  ENDED: '종료된 행사가 없어요',
}

/** 상태를 골랐는데 맞는 행사가 없을 때의 문구. 전체면 undefined — 기존 빈 화면 문구를 쓴다 */
export function getEventEmptyTitle(param: ReturnType<typeof toEventStatusParam>) {
  return param ? EVENT_EMPTY_TITLES[param] : undefined
}
