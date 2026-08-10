/**
 * 채팅 말풍선 옆의 시각과, 날짜 구분선의 날짜.
 *
 * 서버(Spring)는 `LocalDateTime` 을 시간대 없이 준다 — `2026-08-10T07:12:42`.
 * 값 자체는 UTC 인데 표시가 없어서, 그냥 읽으면 로컬 시각으로 오해해 9시간 어긋난다.
 * `getTimeAgo` 와 같은 규칙으로 `Z` 를 붙인다.
 *
 * (웹·앱 공용 단일 원본. 원래 웹 ChatLog.tsx 안에 있던 것을 여기로 올렸다.)
 */
function parse(iso: string): Date {
  const hasTimezone = /Z|[+-]\d{2}:\d{2}/.test(iso)
  return new Date(hasTimezone ? iso : `${iso}Z`)
}

const DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

/** `'오후 1:05'` */
export function formatChatTime(iso: string): string {
  const date = parse(iso)
  const hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = hours < 12 ? '오전' : '오후'
  const hour12 = hours % 12 || 12
  return `${period} ${hour12}:${minutes}`
}

/** `'2026년 8월 10일 월요일'` */
export function formatChatDate(iso: string): string {
  const date = parse(iso)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${DAYS[date.getDay()]}`
}

/** 날짜별로 묶을 때 쓰는 열쇠. 같은 날이면 같은 값이 나온다. */
export function chatDateKey(iso: string): string {
  return parse(iso).toDateString()
}
