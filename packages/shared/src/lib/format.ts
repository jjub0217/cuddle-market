/**
 * 가격에 천 단위 콤마를 붙인다. 단위('원')는 붙이지 않는다.
 * 화면마다 '원'을 붙이는 위치가 달라서(웹은 별도 span) 단위는 호출부가 정한다.
 * 소수점은 버린다. 로케일을 'ko-KR'로 고정해 환경에 따라 결과가 달라지지 않게 한다.
 */
export function formatPrice(price: number): string {
  return Math.floor(price).toLocaleString('ko-KR')
}

/**
 * 거래 가능 여부.
 * tradeStatus가 null이거나 판매중(SELLING)이면 true.
 * (검증된 서버 코드값: SELLING / RESERVED / COMPLETED)
 */
export function isTradeAvailable(tradeStatus: string | null): boolean {
  return tradeStatus === null || tradeStatus === 'SELLING'
}

/**
 * 생년월일을 화면에 보여줄 모양으로 바꾼다. `2000-03-07` → `2000.03.07`
 *
 * ⚠️ **웹·앱이 같은 함수를 쓴다.** 예전에는 웹만 `2000. 03. 07`(점 뒤 빈칸)로 그리고
 *    앱은 서버 값(`2000-03-07`)을 그대로 내보내 **같은 값이 다르게 보였다.**
 *
 * 왜 점으로 잇나 — 이 제품이 이미 쓰는 모양이다(`ProfileData`의 `formatJoinDate`가
 * 가입일을 `2026.01.01`로 그린다). 데스크탑 프로필 수정에서는 생년월일(폼)과
 * 가입일(옆 칸)이 **한 화면에 같이 보여서** 모양이 다르면 바로 눈에 띈다.
 * 하이픈(`2000-03-07`)은 날짜보다 데이터로 읽히고, 웹의 `formatDate`도 시각을
 * 붙일 때만 쓴다.
 *
 * ⚠️ 앞의 0을 지우지 않는다. `toLocaleDateString('ko-KR')`은 `2000. 3. 7.`로 지우지만,
 *    자릿수가 고정돼야 값이 나란히 놓일 때 폭이 들쭉날쭉하지 않다.
 */
export function formatBirthDate(birthDate?: string | null): string {
  if (!birthDate) return ''
  return birthDate.replace(/-/g, '.')
}

/**
 * 가입일을 화면에 보여줄 모양으로 바꾼다. `2023-04-12T10:30:00` → `2023.04.12`
 *
 * ⚠️ **웹·앱이 같은 함수를 쓴다.** 원래는 웹의 `ProfileData.tsx` 안에 갇혀 있어 앱이
 *    못 썼다. 생년월일도 같은 이유로 갈렸었다(`formatBirthDate` 설명).
 *
 * 모양은 `formatBirthDate` 와 맞췄다 — 프로필에서 두 날짜가 같이 보인다.
 *
 * ⚠️ 시각은 뗀다. 「언제부터 쓴 사람인가」가 궁금한 값이지 몇 시에 가입했는지가 아니다.
 * ⚠️ 날짜로 못 읽으면 빈 글자를 준다. 호출부가 그 빈 값을 보고 줄을 안 그린다.
 */
export function formatJoinDate(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
