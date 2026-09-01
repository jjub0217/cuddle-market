/**
 * 가격에 천 단위 콤마를 붙인다. 단위('원')는 붙이지 않는다.
 * 화면마다 '원'을 붙이는 위치가 달라서(웹은 별도 span) 단위는 호출부가 정한다.
 * 소수점은 버린다. 로케일을 'ko-KR'로 고정해 환경에 따라 결과가 달라지지 않게 한다.
 */
export function formatPrice(price: number): string {
  return Math.floor(price).toLocaleString('ko-KR')
}

/**
 * 판매요청 가격 앞에 붙는 라벨. 판매면 `null` 이라 아무것도 안 그린다.
 *
 * 왜 두나 — 같은 「12,000원」이 갈래에 따라 **뜻이 반대**다.
 *
 *   판매      12,000원  →  "이 값에 팝니다"      (파는 사람이 정한 값)
 *   판매요청   12,000원  →  "이 값에 사고 싶어요"  (사는 사람이 부르는 값)
 *
 * 뱃지에 「판매요청」이 있어도 가격 자체는 판매가처럼 읽혀서, 값 앞에 말을 붙여 가른다.
 * 웹 등록 폼이 이미 「희망 가격」으로 물어보므로(`ProductRequestForm.tsx`) 적을 때 쓰는
 * 말과 보일 때 쓰는 말을 같게 맞춘 것이다.
 *
 * ⚠️ **값에 이어 붙이지 말고 따로 그린다.** 상세에서는 제목과 가격이 크기·굵기가 같아서
 *    (앱은 둘 다 20/700), 「희망」을 값과 같은 크기로 그리면 **두 줄이 한 덩어리로
 *    읽힌다.** 2026-09-01 에 실제 화면에서 걸렸다 — 숫자만 있을 때는 눈으로 갈렸는데
 *    한글이 앞에 붙으면서 제목처럼 보였다.
 *    → 호출부가 **작고 연한 글자**로 따로 그린다. 값의 일부가 아니라 값의 성격을
 *      말하는 라벨이라, 크기를 낮추면 뜻도 더 잘 읽힌다.
 * ⚠️ 빈칸은 안 붙인다. 사이 띄우기는 그리는 쪽이 여백으로 준다.
 * ⚠️ 한글 이름('판매요청')이 아니라 **원본 코드('REQUEST')로 가른다.** 화면 문구가
 *    바뀌어도 안 깨진다 — 앱 카드(`product-card.tsx`)도 같은 이유로 코드로 가른다.
 */
export function getPriceLabel(productType?: string | null): string | null {
  return productType === 'REQUEST' ? '희망' : null
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
