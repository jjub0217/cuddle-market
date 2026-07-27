# 앱 상품 상세 화면 구현 계획

> **에이전트용:** 이 계획은 `superpowers:subagent-driven-development`(권장) 또는
> `superpowers:executing-plans`로 한 과제씩 실행한다. 단계는 체크박스(`- [ ]`)로 추적한다.

**목표:** 홈 목록에서 카드를 누르면 상품 상세 화면으로 이동하는 경로를 열고, 그 과정에서
웹과 앱이 같은 공유 패키지를 보도록 배관을 뚫는다.

**접근:** 먼저 모노레포 배관을 뚫고 가장 작은 함수 하나(`formatPrice`)로 길이 통했는지 증명한다.
그다음 새 라벨 로직을 처음부터 `@cuddle/shared`에 만들고, 앱이 그것을 소비하게 한다.
마지막으로 홈 탭 안에 스택을 중첩해 상세 화면을 띄운다.

**기술 스택:** pnpm workspace, Next.js 16(웹), Expo SDK 54 + expo-router 6(앱),
TanStack Query v5, Vitest(shared), Jest + jest-expo(mobile)

**설계 문서:** `docs/superpowers/specs/2026-07-23-rn-product-detail-design.md`

## 전역 제약

- **Expo SDK는 54로 고정한다.** 올리지 않는다 (사용자 실기기 Expo Go가 54 전용).
- **웹을 깨뜨리지 않는다.** 웹 관련 파일을 건드린 과제는 반드시 `pnpm build`로 검증한다.
- **`@cuddle/shared`에는 순수 로직만 둔다.** 색상·치수 등 화면 표현은 앱에 남긴다.
- **성공/오류 판정은 HTTP status(`res.ok`) 기준.** 응답 body의 `code` 값을 쓰지 않는다.
- **코드 스타일은 파일별 이웃을 따른다.** `packages/shared/**`와 `mobile/lib/**`는 세미콜론 없음,
  `mobile/components/**`와 `mobile/app/**`는 세미콜론 있음. 전부 작은따옴표.
- **커밋 메시지 끝에** `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` 를 넣는다.
- **작업 브랜치에서 작업한다.** `main`·`develop`에 직접 커밋하지 않는다.
- 상품 타입 코드값은 `SELL`(판매) / `REQUEST`(판매요청) 두 개다.
- 거래상태 코드값은 `SELLING` / `RESERVED` / `COMPLETED` / `null` 네 가지다.

---

## 파일 구조

### 새로 만드는 파일

| 파일 | 책임 |
|---|---|
| `packages/shared/src/lib/timeAgo.ts` | `createdAt` → "3일 전" 상대시간 |
| `packages/shared/src/lib/productLabels.ts` | 상품 타입·상태 코드 → 한글 |
| `packages/shared/src/lib/petLabels.ts` | 펫 세부종류 40개·카테고리 8개 코드 → 한글 |
| `packages/shared/src/lib/tradeStatus.ts` | 거래상태 코드 → 한글 라벨 (판매요청 예외 포함) |
| `mobile/components/product-detail/breadcrumb.tsx` | `앵무새 › 사료/간식` 한 줄 |
| `mobile/components/product-detail/image-carousel.tsx` | 이미지 가로 스와이프 + 거래상태 오버레이 |
| `mobile/components/product-detail/product-summary.tsx` | 뱃지·제목·가격·시간·지역 |
| `mobile/components/product-detail/seller-card.tsx` | 판매자 프로필 |
| `mobile/components/product-detail/detail-states.tsx` | 스켈레톤·404·오류 |
| `mobile/app/(tabs)/(home)/_layout.tsx` | 홈 탭 안의 스택 |
| `mobile/app/(tabs)/(home)/products/[id].tsx` | 상세 화면 조립 |

### 고치는 파일

| 파일 | 무엇을 |
|---|---|
| `package.json` (루트) | `@cuddle/shared` 워크스페이스 의존성 추가 |
| `next.config.ts` | `transpilePackages` 추가 |
| `tsconfig.json` (루트) | 웹이 shared를 볼 수 있게 exclude 조정 |
| `src/lib/utils/formatPrice.ts` | 재수출 껍데기로 교체 |
| `packages/shared/src/lib/format.ts` | `formatPrice`가 '원'을 붙이지 않도록 통일 |
| `packages/shared/src/index.ts` | 새 모듈 내보내기 |
| `packages/shared/src/types/product.ts` | `ProductDetailItem` 추가 |
| `mobile/lib/products.ts` | `fetchProductDetail(id)` 추가 |
| `mobile/lib/tradeStatus.ts` | `getTradeLabel`을 shared 것으로 교체, `getOverlay`만 남김 |
| `mobile/components/product-card.tsx` | 안에 있던 순수 함수 3개를 shared 것으로 교체, 가격에 '원' 붙임 |
| `mobile/app/(tabs)/_layout.tsx` | 홈 탭 이름을 `(home)`으로 |
| `mobile/app/(tabs)/index.tsx` | `(home)/index.tsx`로 이동 + 카드 누르면 상세로 |

---

## Task 1: 모노레포 배관 + `formatPrice` 단일 원본

**목적:** 웹이 `@cuddle/shared`를 실제로 볼 수 있게 만들고, 가장 작은 함수 하나로 그것을 증명한다.

**주의 — 두 `formatPrice`는 동작이 다르다:**

```
웹    formatPrice(2000) → "2,000"     호출부에서 밖에 '원'을 붙임 (9곳)
shared formatPrice(2000) → "2,000원"  '원'까지 포함
```

그냥 재수출하면 웹에 **"2,000원원"** 이 뜬다. 그래서 shared 쪽을 웹 방식(숫자만)으로 통일하고,
앱 호출부에서 '원'을 붙인다. 앱 호출부는 1곳뿐이라 이쪽이 훨씬 싸다.

**Files:**
- Modify: `packages/shared/src/lib/format.ts`
- Modify: `packages/shared/src/lib/format.test.ts`
- Modify: `mobile/components/product-card.tsx:114` (가격 렌더 부분)
- Modify: `package.json` (루트)
- Modify: `next.config.ts`
- Modify: `tsconfig.json` (루트)
- Modify: `src/lib/utils/formatPrice.ts`

**Interfaces:**
- Produces: `formatPrice(price: number): string` — `@cuddle/shared`에서 내보냄. **'원'을 붙이지 않는다.**
  예) `formatPrice(2000) === '2,000'`

- [ ] **Step 1: 작업 브랜치를 만든다**

```bash
git checkout develop && git pull origin develop
git checkout -b feat/rn-product-detail
```

- [ ] **Step 2: shared `formatPrice` 테스트를 새 규칙으로 고친다 (실패하는 테스트)**

`packages/shared/src/lib/format.test.ts` 의 `formatPrice` describe 블록을 아래로 교체한다.

```ts
describe('formatPrice', () => {
  it("천 단위 콤마만 붙이고 '원'은 붙이지 않는다", () => {
    expect(formatPrice(1000)).toBe('1,000')
    expect(formatPrice(0)).toBe('0')
    expect(formatPrice(2000000)).toBe('2,000,000')
  })

  it('소수점은 버린다', () => {
    expect(formatPrice(1000.9)).toBe('1,000')
  })
})
```

- [ ] **Step 3: 테스트가 실패하는지 확인한다**

Run: `pnpm --filter @cuddle/shared test`
Expected: FAIL — `expected '1,000원' to be '1,000'`

- [ ] **Step 4: shared `formatPrice`를 고친다**

`packages/shared/src/lib/format.ts` 의 `formatPrice`를 교체한다 (`isTradeAvailable`은 그대로 둔다).

```ts
/**
 * 가격에 천 단위 콤마를 붙인다. 단위('원')는 붙이지 않는다.
 * 화면마다 '원'을 붙이는 위치가 달라서(웹은 별도 span) 단위는 호출부가 정한다.
 * 소수점은 버린다. 로케일을 'ko-KR'로 고정해 환경에 따라 결과가 달라지지 않게 한다.
 */
export function formatPrice(price: number): string {
  return Math.floor(price).toLocaleString('ko-KR')
}
```

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `pnpm --filter @cuddle/shared test`
Expected: PASS (formatPrice 2건 + isTradeAvailable 기존 건 전부 통과)

- [ ] **Step 6: 앱 호출부에서 '원'을 붙인다**

`mobile/components/product-card.tsx` 의 가격 렌더를 고친다.

```tsx
        {/* 가격 (강조) — 단위는 화면에서 붙인다 */}
        <Text style={styles.price}>{`${formatPrice(product.price)}원`}</Text>
```

- [ ] **Step 7: 앱 테스트가 여전히 통과하는지 확인한다**

Run: `cd mobile && pnpm test`
Expected: PASS (기존 14건)

- [ ] **Step 8: 루트 package.json에 워크스페이스 의존성을 추가한다**

`dependencies` 맨 앞에 한 줄 추가한다.

```json
    "@cuddle/shared": "workspace:*",
```

- [ ] **Step 9: next.config.ts에 transpilePackages를 추가한다**

`@cuddle/shared`는 빌드 산출물 없이 TypeScript 소스를 그대로 내보내는 패키지라,
Next.js가 직접 변환하도록 알려줘야 한다.

```ts
const nextConfig: NextConfig = {
  // @cuddle/shared는 빌드 없이 TS 소스를 그대로 내보내는 워크스페이스 패키지라
  // Next가 직접 변환해야 한다.
  transpilePackages: ['@cuddle/shared'],
  images: {
```

- [ ] **Step 10: 루트 tsconfig의 exclude를 조정한다**

`packages`를 통째로 빼 두면 웹이 shared 소스를 타입체크 대상에 넣지 못한다. 다만 그냥 지우면
두 가지가 딸려 들어온다.

- `packages/shared/src/**/*.test.ts` — `vitest`를 import한다. 웹에는 vitest 타입이 없어 빌드가 깨진다.
- `packages/shared/node_modules` — `exclude`를 직접 지정하면 TypeScript의 기본 제외가 꺼져서
  중첩 `node_modules`가 걸린다.

둘 다 명시적으로 막는다.

```json
  "exclude": [
    "node_modules",
    "**/node_modules",
    "mobile",
    "packages/**/*.test.ts"
  ]
```

- [ ] **Step 11: 의존성을 설치한다**

Run: `pnpm install`
Expected: `+ @cuddle/shared 0.0.0 <- packages/shared` 같은 링크 줄이 보인다.

- [ ] **Step 12: 웹 formatPrice를 재수출 껍데기로 바꾼다**

`src/lib/utils/formatPrice.ts` 전체를 교체한다. **경로는 그대로 두므로 웹 9개 파일은 손대지 않는다.**

```ts
// 원본은 packages/shared에 있다. 웹·앱이 같은 함수를 쓰게 하려고 여기서는 재수출만 한다.
// (기존 import 경로를 유지해 호출부를 고치지 않기 위한 껍데기)
export { formatPrice } from '@cuddle/shared'
```

- [ ] **Step 13: 마커를 심어 웹이 정말 shared를 보는지 증명한다**

`packages/shared/src/lib/format.ts` 의 `formatPrice` 반환값에 표식을 잠깐 붙인다.

```ts
  return 'ZZ' + Math.floor(price).toLocaleString('ko-KR')
```

Run: `pnpm dev` → 브라우저에서 홈(`http://localhost:3000`) 열기
Expected: 상품 가격이 `ZZ2,000원` 처럼 보인다.
**안 보이면 배관이 안 뚫린 것이다.** Step 8~12를 다시 확인한다.

- [ ] **Step 14: 마커를 지운다**

`packages/shared/src/lib/format.ts` 를 Step 4의 코드로 되돌린다 (`'ZZ' +` 제거).

Run: `pnpm --filter @cuddle/shared test`
Expected: PASS

- [ ] **Step 15: 웹 빌드 게이트**

Run: `pnpm build`
Expected: 성공. 실패하면 여기서 멈추고 원인을 고친다. **다음 과제로 넘어가지 않는다.**

- [ ] **Step 16: 커밋**

```bash
git add package.json next.config.ts tsconfig.json pnpm-lock.yaml \
  src/lib/utils/formatPrice.ts packages/shared/src/lib/format.ts \
  packages/shared/src/lib/format.test.ts mobile/components/product-card.tsx
git commit -m "$(cat <<'EOF'
chore: 웹이 @cuddle/shared를 참조하도록 배관 연결

- 루트 package.json에 워크스페이스 의존성 추가
- next.config에 transpilePackages 추가(빌드 없는 TS 소스 패키지)
- 루트 tsconfig exclude에서 packages 제외 해제
- formatPrice 시맨틱을 '숫자만'으로 통일하고 웹은 재수출 껍데기로 전환
- 앱 호출부에서 '원'을 붙이도록 수정

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: shared 라벨 모듈 4개

**목적:** 상세 화면에 필요한 코드→한글 변환을 전부 공유 패키지에 만든다. 순수 함수라 Vitest로 검증한다.

**Files:**
- Create: `packages/shared/src/lib/timeAgo.ts`
- Create: `packages/shared/src/lib/timeAgo.test.ts`
- Create: `packages/shared/src/lib/productLabels.ts`
- Create: `packages/shared/src/lib/productLabels.test.ts`
- Create: `packages/shared/src/lib/petLabels.ts`
- Create: `packages/shared/src/lib/petLabels.test.ts`
- Create: `packages/shared/src/lib/tradeStatus.ts`
- Create: `packages/shared/src/lib/tradeStatus.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: 없음 (순수 함수)
- Produces (전부 `@cuddle/shared`에서 내보냄):
  - `getTimeAgo(createdAt: string): string`
  - `getProductTypeLabel(code: string): string`
  - `getProductStatusLabel(code: string): string`
  - `getPetDetailLabel(code: string): string`
  - `getCategoryLabel(code: string): string`
  - `getTradeLabel(tradeStatus: string | null, productType: string): string`

- [ ] **Step 1: 실패하는 테스트 4개를 쓴다**

`packages/shared/src/lib/timeAgo.test.ts`

```ts
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
```

`packages/shared/src/lib/productLabels.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { getProductTypeLabel, getProductStatusLabel } from './productLabels'

describe('getProductTypeLabel', () => {
  it('SELL은 판매, REQUEST는 판매요청', () => {
    expect(getProductTypeLabel('SELL')).toBe('판매')
    expect(getProductTypeLabel('REQUEST')).toBe('판매요청')
  })

  it('모르는 코드는 그대로 돌려준다', () => {
    expect(getProductTypeLabel('WHAT')).toBe('WHAT')
  })
})

describe('getProductStatusLabel', () => {
  it('4가지 상품 상태를 한글로 바꾼다', () => {
    expect(getProductStatusLabel('NEW')).toBe('새 상품')
    expect(getProductStatusLabel('LIKE_NEW')).toBe('거의 새것')
    expect(getProductStatusLabel('USED')).toBe('사용감 있음')
    expect(getProductStatusLabel('NEED_REPAIR')).toBe('수리 필요')
  })

  it('모르는 코드는 그대로 돌려준다', () => {
    expect(getProductStatusLabel('BROKEN')).toBe('BROKEN')
  })
})
```

`packages/shared/src/lib/petLabels.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { getPetDetailLabel, getCategoryLabel } from './petLabels'

describe('getPetDetailLabel', () => {
  it('펫 세부종류 코드를 한글로 바꾼다', () => {
    expect(getPetDetailLabel('PARROT')).toBe('앵무새')
    expect(getPetDetailLabel('DOG')).toBe('강아지')
    expect(getPetDetailLabel('AXOLOTL')).toBe('우파루파')
  })

  it('모르는 코드는 그대로 돌려준다', () => {
    expect(getPetDetailLabel('DRAGON')).toBe('DRAGON')
  })
})

describe('getCategoryLabel', () => {
  it('카테고리 코드를 한글로 바꾼다', () => {
    expect(getCategoryLabel('FOOD')).toBe('사료/간식')
    expect(getCategoryLabel('WALKING')).toBe('외출용품')
  })

  it('모르는 코드는 그대로 돌려준다', () => {
    expect(getCategoryLabel('SPACE')).toBe('SPACE')
  })
})
```

`packages/shared/src/lib/tradeStatus.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { getTradeLabel } from './tradeStatus'

describe('getTradeLabel', () => {
  it('판매(SELL) 글의 거래상태', () => {
    expect(getTradeLabel('SELLING', 'SELL')).toBe('판매중')
    expect(getTradeLabel('RESERVED', 'SELL')).toBe('예약중')
    expect(getTradeLabel('COMPLETED', 'SELL')).toBe('판매완료')
    expect(getTradeLabel(null, 'SELL')).toBe('판매중')
  })

  it('판매요청(REQUEST) 글은 완료·없음일 때 라벨이 다르다', () => {
    expect(getTradeLabel('COMPLETED', 'REQUEST')).toBe('요청완료')
    expect(getTradeLabel(null, 'REQUEST')).toBe('요청중')
  })

  it('판매요청이어도 예약중은 그대로 예약중', () => {
    expect(getTradeLabel('RESERVED', 'REQUEST')).toBe('예약중')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `pnpm --filter @cuddle/shared test`
Expected: FAIL — `Failed to load ./timeAgo` 등 모듈을 못 찾는 오류 4건

- [ ] **Step 3: `timeAgo.ts`를 만든다**

```ts
/**
 * 등록 시각을 "3일 전" 같은 상대시간으로 바꾼다.
 * 1년이 넘으면 "2024.03.05" 형태의 날짜로 표시한다.
 * (웹 src/lib/utils/getTimeAgo.ts와 같은 규칙)
 */
export function getTimeAgo(createdAt: string): string {
  const now = new Date()
  const created = new Date(createdAt)
  const diffMs = now.getTime() - created.getTime()

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`
  if (diffHours < 24) return `${diffHours}시간 전`
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${diffWeeks}주 전`
  if (diffDays < 365) return `${diffMonths}개월 전`

  const year = created.getFullYear()
  const month = String(created.getMonth() + 1).padStart(2, '0')
  const day = String(created.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}
```

- [ ] **Step 4: `productLabels.ts`를 만든다**

```ts
// 상품 타입·상태 코드값 → 한글 라벨.
// 근거: 웹 constants.ts의 PRODUCT_TYPE_TABS, CONDITION_ITEMS.

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  SELL: '판매',
  REQUEST: '판매요청',
}

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  NEW: '새 상품',
  LIKE_NEW: '거의 새것',
  USED: '사용감 있음',
  NEED_REPAIR: '수리 필요',
}

/** 상품 타입 코드 → 한글. 모르는 코드는 그대로 돌려준다. */
export function getProductTypeLabel(code: string): string {
  return PRODUCT_TYPE_LABELS[code] ?? code
}

/** 상품 상태 코드 → 한글. 모르는 코드는 그대로 돌려준다. */
export function getProductStatusLabel(code: string): string {
  return PRODUCT_STATUS_LABELS[code] ?? code
}
```

- [ ] **Step 5: `petLabels.ts`를 만든다**

```ts
// 펫 세부종류·상품 카테고리 코드값 → 한글 라벨.
// 근거: 웹 constants.ts의 PETS(details), PRODUCT_CATEGORIES.

const PET_DETAIL_LABELS: Record<string, string> = {
  // 포유류
  DOG: '강아지',
  CAT: '고양이',
  RABBIT: '토끼',
  HAMSTER: '햄스터',
  GUINEA_PIG: '기니피그',
  FERRET: '페럿',
  CHINCHILLA: '친칠라',
  HEDGEHOG: '고슴도치',
  // 조류
  BUDGERIGAR: '잉꼬',
  PARROT: '앵무새',
  CANARY: '카나리아',
  LOVEBIRD: '모란앵무',
  // 파충류
  LIZARD: '도마뱀',
  SNAKE: '뱀',
  TURTLE: '거북이',
  GECKO: '게코',
  // 수생동물
  GOLDFISH: '금붕어',
  TROPICAL_FISH: '열대어',
  CHERRY_SHRIMP: '체리새우',
  SNAIL: '달팽이',
  // 곤충/절지동물
  CRICKET: '귀뚜라미',
  MANTIS: '사마귀',
  BEETLE: '딱정벌레',
  SPIDER: '거미',
  // 양서류
  FROG: '개구리',
  SALAMANDER: '도롱뇽',
  AXOLOTL: '우파루파',
  NEWT: '트리프로그',
  // 설치류
  SQUIRREL: '다람쥐',
  MOUSE: '마우스',
  RAT: '랫',
  GERBIL: '저빌',
  // 갑각류
  CRAYFISH: '가재',
  HERMIT_CRAB: '소라게',
  CRAB: '크랩',
  GIANT_CRAB: '대게',
  // 식물/수초
  AQUATIC_PLANT: '수초',
  MOSS: '이끼',
  SUCCULENT: '다육이',
  PET_PLANT: '반려식물',
}

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: '사료/간식',
  TOY: '장난감',
  HOUSE: '하우스',
  HEALTH: '건강/위생',
  CLOTHING: '의류/잡화',
  WALKING: '외출용품',
  GROOMING: '미용/목욕',
  ETC: '기타',
}

/** 펫 세부종류 코드 → 한글. 모르는 코드는 그대로 돌려준다. */
export function getPetDetailLabel(code: string): string {
  return PET_DETAIL_LABELS[code] ?? code
}

/** 상품 카테고리 코드 → 한글. 모르는 코드는 그대로 돌려준다. */
export function getCategoryLabel(code: string): string {
  return CATEGORY_LABELS[code] ?? code
}
```

- [ ] **Step 6: `tradeStatus.ts`를 만든다**

```ts
// 거래상태 코드값 → 한글 라벨.
// 판매요청(REQUEST) 글은 완료·없음일 때 다른 말을 쓴다.
// 오버레이 색·치수는 화면 표현이라 여기 두지 않는다(앱 mobile/lib/tradeStatus.ts).

/**
 * 서버 tradeStatus 코드값 → 사람이 읽는 라벨.
 * @param tradeStatus SELLING / RESERVED / COMPLETED / null
 * @param productType SELL(판매) 또는 REQUEST(판매요청)
 */
export function getTradeLabel(tradeStatus: string | null, productType: string): string {
  const isRequest = productType === 'REQUEST'

  switch (tradeStatus) {
    case 'SELLING':
      return '판매중'
    case 'RESERVED':
      return '예약중'
    case 'COMPLETED':
      return isRequest ? '요청완료' : '판매완료'
    default:
      // null 등: 판매요청이면 "요청중", 그 외는 기본 "판매중"으로 취급.
      return isRequest ? '요청중' : '판매중'
  }
}
```

- [ ] **Step 7: `index.ts`에서 내보낸다**

`packages/shared/src/index.ts` 전체를 교체한다.

```ts
export * from './types/product'
export * from './lib/format'
export * from './lib/timeAgo'
export * from './lib/productLabels'
export * from './lib/petLabels'
export * from './lib/tradeStatus'
```

- [ ] **Step 8: 테스트가 통과하는지 확인한다**

Run: `pnpm --filter @cuddle/shared test`
Expected: PASS — 전체 통과 (기존 format 2건 + 새 11건)

- [ ] **Step 9: 웹 빌드 게이트**

shared가 웹 타입체크 대상에 들어왔으므로 새 파일이 웹 빌드를 깨지 않는지 확인한다.

Run: `pnpm build`
Expected: 성공

- [ ] **Step 10: 커밋**

```bash
git add packages/shared/src
git commit -m "$(cat <<'EOF'
feat(shared): 상품 라벨·상대시간·거래상태 순수 로직 추가

상세 화면에 필요한 코드→한글 변환을 공유 패키지에 만든다.
오버레이 색 같은 화면 표현은 넣지 않는다(로직만 공유).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 앱이 shared 라벨을 쓰게 바꾼다

**목적:** `product-card.tsx` 안에 갇혀 있던 순수 함수와 앱의 `getTradeLabel`을 shared 것으로 갈아끼운다.
앱에는 화면 표현(`getOverlay`)만 남는다.

**Files:**
- Modify: `mobile/lib/tradeStatus.ts`
- Modify: `mobile/lib/tradeStatus.test.ts`
- Modify: `mobile/components/product-card.tsx`

**Interfaces:**
- Consumes: `getTimeAgo`, `getProductTypeLabel`, `getProductStatusLabel`, `getTradeLabel` (Task 2)
- Produces: `getOverlay(tradeStatus: string | null, productType: string): TradeOverlay | null`
  — `mobile/lib/tradeStatus.ts`에 남는 유일한 함수. `TradeOverlay = { scrim: string; label: string }`

- [ ] **Step 1: 앱 `tradeStatus.ts`에서 `getTradeLabel`을 걷어낸다**

`mobile/lib/tradeStatus.ts` 전체를 교체한다.

```ts
import { getTradeLabel } from '@cuddle/shared'

// 거래상태에 따른 썸네일/이미지 오버레이 규칙(UI 스펙 §5).
// 라벨 자체는 @cuddle/shared로 옮겼고, 여기에는 화면 표현(색·구성)만 남긴다.

/** 이미지 위에 덮는 오버레이 스펙. null이면 오버레이 없음. */
export interface TradeOverlay {
  /** 스크림(어두운 막) 색. 예약중=0.40, 완료계열=0.60 */
  scrim: string
  /** 중앙 흰 pill에 넣는 상태 글자 */
  label: string
}

/**
 * 거래상태에 따른 오버레이 규칙(UI 스펙 §5).
 * - 판매중 / 요청중 → null (오버레이 없음)
 * - 예약중 → 스크림 0.40 + 흰 pill "예약중"
 * - 완료 계열(판매완료·요청완료) → 스크림 0.60 + 흰 pill(라벨)
 */
export function getOverlay(tradeStatus: string | null, productType: string): TradeOverlay | null {
  switch (tradeStatus) {
    case 'RESERVED':
      return { scrim: 'rgba(0, 0, 0, 0.40)', label: '예약중' }
    case 'COMPLETED':
      return { scrim: 'rgba(0, 0, 0, 0.60)', label: getTradeLabel(tradeStatus, productType) }
    default:
      // SELLING, null(요청중) 등 → 오버레이 없음.
      return null
  }
}
```

- [ ] **Step 2: 앱 테스트에서 `getTradeLabel` 부분을 걷어낸다**

`mobile/lib/tradeStatus.test.ts` 전체를 교체한다. 라벨 검증은 shared(Vitest)로 옮겼으므로
여기서는 오버레이만 본다. **같은 코드를 두 러너로 검사하지 않는다.**

```ts
import { getOverlay } from './tradeStatus'

// 라벨 검증은 @cuddle/shared(Vitest)로 옮겼다.
// 여기서는 화면 표현인 오버레이 규칙만 본다. 근거: UI 스펙 §5.

describe('getOverlay', () => {
  it('판매중·요청중은 오버레이가 없다', () => {
    expect(getOverlay('SELLING', 'SELL')).toBeNull()
    expect(getOverlay(null, 'REQUEST')).toBeNull()
  })

  it('예약중은 스크림 0.40 + 예약중 pill', () => {
    expect(getOverlay('RESERVED', 'SELL')).toEqual({
      scrim: 'rgba(0, 0, 0, 0.40)',
      label: '예약중',
    })
  })

  it('완료는 스크림 0.60이고 타입에 따라 라벨이 다르다', () => {
    expect(getOverlay('COMPLETED', 'SELL')).toEqual({
      scrim: 'rgba(0, 0, 0, 0.60)',
      label: '판매완료',
    })
    expect(getOverlay('COMPLETED', 'REQUEST')).toEqual({
      scrim: 'rgba(0, 0, 0, 0.60)',
      label: '요청완료',
    })
  })
})
```

- [ ] **Step 3: 카드에서 지역 함수 3개를 걷어낸다**

`mobile/components/product-card.tsx` 상단의 import와, `getProductTypeLabel` ·
`getProductStatusLabel` · `getTimeAgo` 함수 정의 전체(약 50줄)를 아래로 교체한다.
컴포넌트 본문(`export function ProductCard`)과 `styles`는 그대로 둔다.

```tsx
import {
  formatPrice,
  getProductStatusLabel,
  getProductTypeLabel,
  getTimeAgo,
  type Product,
} from '@cuddle/shared';
import { StyleSheet, Text, View } from 'react-native';

import { ProductThumbnail } from '@/components/product-thumbnail';

// 가로형 상품 카드(UI 스펙 §4). 좌 썸네일 + 우 정보영역.
// 펫종류 없음, 찜="찜 N" 텍스트(표시전용, 토글 X).
// 코드→한글 변환과 상대시간은 @cuddle/shared에서 가져온다(웹과 같은 원본).
```

- [ ] **Step 4: 앱 테스트가 통과하는지 확인한다**

Run: `cd mobile && pnpm test`
Expected: PASS

- [ ] **Step 5: 앱 타입체크**

Run: `cd mobile && pnpm exec tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add mobile/lib/tradeStatus.ts mobile/lib/tradeStatus.test.ts mobile/components/product-card.tsx
git commit -m "$(cat <<'EOF'
refactor(mobile): 라벨·상대시간을 @cuddle/shared로 일원화

카드 안에 복사돼 있던 순수 함수 3개와 getTradeLabel을 공유 패키지 것으로 교체.
앱에는 화면 표현인 getOverlay만 남긴다. 라벨 테스트도 Vitest로 이관.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 상세 타입 + 단건 조회 API

**목적:** 상세 응답 타입을 공유 패키지에 정의하고, 앱에서 단건 조회 함수를 만든다.

**Files:**
- Modify: `packages/shared/src/types/product.ts`
- Modify: `mobile/lib/products.ts`
- Modify: `mobile/lib/products.test.ts`

**Interfaces:**
- Consumes: `Product` (기존 shared 타입)
- Produces:
  - `ProductDetailItem` — `Product`를 확장한 상세 타입. `@cuddle/shared`에서 내보냄
  - `fetchProductDetail(id: number): Promise<ProductDetailItem>` — `mobile/lib/products.ts`
  - `ProductNotFoundError` — 404일 때 던지는 오류 클래스. `mobile/lib/products.ts`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`mobile/lib/products.test.ts` 맨 아래에 붙인다. 파일 상단 import도 함께 고친다.

```ts
import { fetchProductDetail, fetchProducts, ProductNotFoundError } from './products'
```

```ts
function makeDetail() {
  return {
    ...makeProduct(61),
    category: 'FOOD',
    description: '두부간식 잘먹어요',
    subImageUrls: [],
    addressSido: '서울특별시',
    addressGugun: '은평구',
    viewCount: 12,
    sellerInfo: {
      sellerId: 28,
      sellerNickname: '유리',
      sellerProfileImageUrl: null,
      addressSido: '서울특별시',
      addressGugun: '은평구',
    },
    sellerOtherProducts: [],
  }
}

describe('fetchProductDetail', () => {
  it('200이면 data를 그대로 반환한다', async () => {
    const detail = makeDetail()
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: '성공', data: detail }),
    })

    const result = await fetchProductDetail(61)

    expect(result.title).toBe('상품 61')
    expect(result.sellerInfo.sellerNickname).toBe('유리')
  })

  it('/products/{id} 를 호출한다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 'SUCCESS', message: '성공', data: makeDetail() }),
    })

    await fetchProductDetail(61)

    expect(mockFetch.mock.calls[0][0]).toContain('/products/61')
  })

  it('404면 ProductNotFoundError를 던진다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })

    await expect(fetchProductDetail(55)).rejects.toBeInstanceOf(ProductNotFoundError)
  })

  it('404가 아닌 실패는 일반 오류를 던진다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

    const promise = fetchProductDetail(61)
    await expect(promise).rejects.toThrow()
    await expect(promise).rejects.not.toBeInstanceOf(ProductNotFoundError)
  })

  it('EXPO_PUBLIC_API_BASE_URL 미설정이면 명확히 throw한다', async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL
    await expect(fetchProductDetail(61)).rejects.toThrow('EXPO_PUBLIC_API_BASE_URL')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인한다**

Run: `cd mobile && pnpm test`
Expected: FAIL — `fetchProductDetail is not a function`

- [ ] **Step 3: 상세 타입을 shared에 추가한다**

`packages/shared/src/types/product.ts` 맨 아래에 붙인다.

```ts
/** 판매자 정보. 프로필 이미지와 지역은 비어 있을 수 있다(실측). */
export interface SellerInfo {
  sellerId: number
  sellerNickname: string
  sellerProfileImageUrl: string | null
  addressSido: string | null
  addressGugun: string | null
}

/**
 * 상품 상세 응답(`GET /products/{id}`의 data).
 * 라이브 검증(2026-07-23): 비로그인 200, code는 문자열 "SUCCESS".
 */
export interface ProductDetailItem extends Product {
  category: string
  description: string
  subImageUrls: string[]
  addressSido: string
  addressGugun: string
  viewCount: number
  // 비로그인으로 조회하면 false가 아니라 null이 온다(실측).
  isFavorite: boolean | null
  sellerInfo: SellerInfo
  sellerOtherProducts: Product[]
}

export interface ProductDetailResponse {
  code: string
  message: string
  data: ProductDetailItem
}
```

`Product`의 `isFavorite`도 함께 고친다 (같은 파일 위쪽).

```ts
  isFavorite: boolean | null
```

- [ ] **Step 4: 단건 조회 함수를 만든다**

`mobile/lib/products.ts` 맨 아래에 붙인다. 파일 상단 import도 고친다.

```ts
import type { ProductDetailItem, ProductDetailResponse, ProductResponse } from '@cuddle/shared'
```

```ts
/** 없는 상품(404). 화면에서 "삭제된 상품" 안내를 띄우려고 따로 구분한다. */
export class ProductNotFoundError extends Error {
  constructor() {
    super('상품을 찾을 수 없습니다.')
    this.name = 'ProductNotFoundError'
  }
}

/**
 * 상품 한 건을 가져온다.
 * `GET {base}/products/{id}`
 * 삭제되었거나 없는 id면 서버가 404를 준다(실측).
 */
export async function fetchProductDetail(id: number): Promise<ProductDetailItem> {
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL
  if (!API_BASE_URL) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다. mobile/.env를 확인하세요.')
  }

  const res = await fetch(`${API_BASE_URL}/products/${id}`)

  if (res.status === 404) {
    throw new ProductNotFoundError()
  }
  if (!res.ok) {
    throw new Error(`상품을 불러오지 못했어요 (HTTP ${res.status})`)
  }

  const body: ProductDetailResponse = await res.json()
  return body.data
}
```

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

Run: `cd mobile && pnpm test`
Expected: PASS

- [ ] **Step 6: 타입체크 + 웹 빌드 게이트**

`Product.isFavorite` 타입이 바뀌었으므로 웹이 영향받는지 확인한다.

Run: `cd mobile && pnpm exec tsc --noEmit`
Expected: 오류 없음

Run: `cd .. && pnpm build`
Expected: 성공

- [ ] **Step 7: 커밋**

```bash
git add packages/shared/src/types/product.ts mobile/lib/products.ts mobile/lib/products.test.ts
git commit -m "$(cat <<'EOF'
feat: 상품 상세 타입과 단건 조회 함수 추가

- ProductDetailItem을 shared에 정의(isFavorite은 실측대로 boolean|null)
- fetchProductDetail: 404를 ProductNotFoundError로 구분해 던짐

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: 라우팅 — 홈 탭 안에 스택 중첩

**목적:** 상세로 이동해도 하단 탭바가 남도록, 홈 탭 안에 스택을 만든다. 아직 화면 내용은 비워둔다.

**참고:** Expo SDK 54 공식 문서의 "Stacks inside tabs" 패턴.
`app/(tabs)/feed/_layout.tsx`에 `Stack`을 두고 `index.tsx`·`[postId].tsx`를 그 안에 넣는 구조.
여기서는 URL을 `/` 로 유지하려고 폴더 이름에 괄호를 써 라우트 그룹 `(home)`으로 만든다.

**Files:**
- Create: `mobile/app/(tabs)/(home)/_layout.tsx`
- Move: `mobile/app/(tabs)/index.tsx` → `mobile/app/(tabs)/(home)/index.tsx`
- Create: `mobile/app/(tabs)/(home)/products/[id].tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`

**Interfaces:**
- Produces: `/products/{id}` 경로. `router.push(\`/products/${id}\`)` 로 이동한다.

- [ ] **Step 1: 홈 화면 파일을 옮긴다**

```bash
mkdir -p "mobile/app/(tabs)/(home)/products"
git mv "mobile/app/(tabs)/index.tsx" "mobile/app/(tabs)/(home)/index.tsx"
```

- [ ] **Step 2: 홈 탭의 스택 레이아웃을 만든다**

`mobile/app/(tabs)/(home)/_layout.tsx`

```tsx
import { Stack } from 'expo-router';

// 홈 탭 안의 스택. 상세로 밀고 들어가도 하단 탭바가 남는다.
// (Expo 공식 "Stacks inside tabs" 패턴)
export const unstable_settings = {
  // 상세로 바로 들어와도(딥링크) 목록이 스택 아래에 먼저 깔리게 한다.
  initialRouteName: 'index',
};

export default function HomeStackLayout() {
  return (
    <Stack>
      {/* 홈은 자체 헤더(커들마켓)를 갖고 있어 스택 헤더를 숨긴다 */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* 상세는 뒤로가기만 있는 빈 헤더 */}
      <Stack.Screen name="products/[id]" options={{ title: '' }} />
    </Stack>
  );
}
```

- [ ] **Step 3: 탭 레이아웃에서 홈 탭 이름을 바꾼다**

`mobile/app/(tabs)/_layout.tsx` 의 첫 번째 `Tabs.Screen`을 고친다.

```tsx
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
```

- [ ] **Step 4: 상세 화면 껍데기를 만든다**

`mobile/app/(tabs)/(home)/products/[id].tsx`

```tsx
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

// 상품 상세. 이 단계에서는 라우팅이 붙었는지만 확인한다(내용은 Task 6~7).
export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>상세 화면 (id: {id})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  text: {
    fontSize: 16,
    color: '#111827',
  },
});
```

- [ ] **Step 5: 카드를 누르면 상세로 가게 한다**

`mobile/app/(tabs)/(home)/index.tsx` 의 import에 두 줄을 더하고, `renderItem`을 고친다.

```tsx
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
```

컴포넌트 본문 맨 위(`const insets = ...` 아래)에 한 줄 추가:

```tsx
  const router = useRouter();
```

`renderItem`을 교체:

```tsx
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/products/${item.id}`)}
            // 누르는 동안 살짝 흐려져서 눌린 걸 알 수 있게 한다
            style={({ pressed }) => (pressed ? styles.cardPressed : undefined)}
          >
            <ProductCard product={item} />
          </Pressable>
        )}
```

`styles`에 한 항목 추가:

```tsx
  cardPressed: {
    opacity: 0.7,
  },
```

- [ ] **Step 6: 타입체크**

Run: `cd mobile && pnpm exec tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 7: 실기기에서 이동과 탭바를 확인한다**

Run: `cd mobile && pnpm expo start`
확인할 것:
1. 목록에서 카드를 누르면 오른쪽에서 상세가 밀려 들어온다
2. **하단 탭바가 그대로 보인다** (이 과제의 핵심)
3. 좌상단 `‹` 와 안드로이드 뒤로가기 둘 다 목록으로 돌아간다
4. 돌아왔을 때 목록의 스크롤 위치가 유지된다

- [ ] **Step 8: 커밋**

```bash
git add "mobile/app/(tabs)"
git commit -m "$(cat <<'EOF'
feat(mobile): 홈 탭 안에 스택을 중첩해 상세 경로 추가

상세로 이동해도 하단 탭바가 남도록 (home) 라우트 그룹에 Stack을 둔다.
카드를 누르면 /products/{id}로 push한다. 화면 내용은 다음 과제.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 상세 화면 조각 컴포넌트

**목적:** 상세 화면을 이루는 표시용 컴포넌트를 만든다. 데이터 연결은 다음 과제.

**Files:**
- Create: `mobile/components/product-detail/breadcrumb.tsx`
- Create: `mobile/components/product-detail/image-carousel.tsx`
- Create: `mobile/components/product-detail/product-summary.tsx`
- Create: `mobile/components/product-detail/seller-card.tsx`

**Interfaces:**
- Consumes: `getPetDetailLabel`, `getCategoryLabel`, `getProductTypeLabel`, `getProductStatusLabel`,
  `getTimeAgo`, `formatPrice` (Task 2), `getOverlay` (Task 3), `ProductDetailItem`·`SellerInfo` (Task 4)
- Produces:
  - `<Breadcrumb petDetailType={string} category={string} />`
  - `<ImageCarousel mainImageUrl={string} subImageUrls={string[]} tradeStatus={string|null} productType={string} />`
  - `<ProductSummary product={ProductDetailItem} />`
  - `<SellerCard seller={SellerInfo} />`

- [ ] **Step 1: 브레드크럼을 만든다**

`mobile/components/product-detail/breadcrumb.tsx`

```tsx
import { getCategoryLabel, getPetDetailLabel } from '@cuddle/shared';
import { StyleSheet, Text, View } from 'react-native';

// 사진 위 좌측의 `앵무새 › 사료/간식` 한 줄(웹 상세와 같은 위치).
// 이번 바퀴에서는 표시만 한다. 누를 곳(홈 필터)이 아직 없다.

interface Props {
  petDetailType: string;
  category: string;
}

export function Breadcrumb({ petDetailType, category }: Props) {
  return (
    <View style={styles.row} accessibilityRole="header">
      <Text style={styles.item}>{getPetDetailLabel(petDetailType)}</Text>
      <Text style={styles.separator}>›</Text>
      {/* 마지막 항목은 웹과 같이 굵게 + 포인트색 */}
      <Text style={styles.last}>{getCategoryLabel(category)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  item: {
    fontSize: 13,
    color: '#6B7280',
  },
  separator: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  last: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EA580C',
  },
});
```

- [ ] **Step 2: 이미지 가로 스와이프를 만든다**

`mobile/components/product-detail/image-carousel.tsx`

```tsx
import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { getOverlay } from '@/lib/tradeStatus';

// 상세 대표 이미지. 메인 + 서브를 이어 가로로 스와이프한다.
// 실데이터는 대부분 1장이고, 1장이면 점 표시가 나오지 않는다.
// 거래상태 오버레이 규칙은 홈 썸네일과 같다(UI 스펙 §5).

interface Props {
  mainImageUrl: string;
  subImageUrls: string[];
  tradeStatus: string | null;
  productType: string;
}

export function ImageCarousel({ mainImageUrl, subImageUrls, tradeStatus, productType }: Props) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);

  const images = [mainImageUrl, ...subImageUrls].filter(Boolean);
  const overlay = getOverlay(tradeStatus, productType);

  return (
    <View style={[styles.container, { width, height: width }]}>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(url, i) => `${url}-${i}`}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) =>
          failedUrls.includes(item) ? (
            // 로드 실패 시 회색 자리(홈 썸네일과 같은 처리)
            <View style={{ width, height: width, backgroundColor: '#E5E7EB' }} />
          ) : (
            <Image
              source={{ uri: item }}
              style={{ width, height: width }}
              contentFit="cover"
              onError={() => setFailedUrls((prev) => [...prev, item])}
            />
          )
        }
      />

      {overlay && (
        <View style={[styles.scrim, { backgroundColor: overlay.scrim }]} pointerEvents="none">
          <View style={styles.pill}>
            <Text style={styles.pillText}>{overlay.label}</Text>
          </View>
        </View>
      )}

      {images.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {images.map((url, i) => (
            <View key={`${url}-dot-${i}`} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E5E7EB',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
});
```

- [ ] **Step 3: 요약(뱃지·제목·가격·시간·지역)을 만든다**

`mobile/components/product-detail/product-summary.tsx`

```tsx
import {
  formatPrice,
  getProductStatusLabel,
  getProductTypeLabel,
  getTimeAgo,
  type ProductDetailItem,
} from '@cuddle/shared';
import { StyleSheet, Text, View } from 'react-native';

// 뱃지 → 제목 → 가격 → 시간·지역. 웹 모바일 폭과 같은 순서.
// 뱃지 색은 홈 카드와 같다(판매=파랑, 판매요청=주황).

interface Props {
  product: ProductDetailItem;
}

export function ProductSummary({ product }: Props) {
  const isRequest = product.productType === 'REQUEST';
  const location = [product.addressSido, product.addressGugun].filter(Boolean).join(' ');

  return (
    <View style={styles.container}>
      <View style={styles.badgeRow}>
        <View style={[styles.badge, isRequest ? styles.badgeRequest : styles.badgeSell]}>
          <Text style={[styles.badgeText, isRequest ? styles.badgeTextRequest : styles.badgeTextSell]}>
            {getProductTypeLabel(product.productType)}
          </Text>
        </View>
        {product.productStatus ? (
          <View style={[styles.badge, styles.badgeOutline]}>
            <Text style={styles.badgeTextOutline}>{getProductStatusLabel(product.productStatus)}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title}>{product.title}</Text>
      <Text style={styles.price}>{`${formatPrice(product.price)}원`}</Text>
      <Text style={styles.meta}>
        {getTimeAgo(product.createdAt)}
        {location ? ` · ${location}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeSell: {
    backgroundColor: '#EFF6FF',
  },
  badgeRequest: {
    backgroundColor: '#FFF7ED',
  },
  badgeOutline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextSell: {
    color: '#2563EB',
  },
  badgeTextRequest: {
    color: '#EA580C',
  },
  badgeTextOutline: {
    fontSize: 12,
    color: '#6B7280',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: '#111827',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EA580C',
  },
  meta: {
    fontSize: 13,
    color: '#6B7280',
  },
});
```

- [ ] **Step 4: 판매자 카드를 만든다**

`mobile/components/product-detail/seller-card.tsx`

```tsx
import type { SellerInfo } from '@cuddle/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// 판매자 프로필. 웹과 같은 위치(설명보다 위).
// 프로필 이미지가 없으면(실측 null 가능) 닉네임 첫 글자를 동그라미에 넣는다.
// 프로필로 이동하는 동작은 로그인이 있어야 해서 이번 바퀴에는 없다.

interface Props {
  seller: SellerInfo;
}

export function SellerCard({ seller }: Props) {
  const [failed, setFailed] = useState(false);
  const location = [seller.addressSido, seller.addressGugun].filter(Boolean).join(' ');
  const showImage = Boolean(seller.sellerProfileImageUrl) && !failed;

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        {showImage ? (
          <Image
            source={{ uri: seller.sellerProfileImageUrl as string }}
            style={styles.avatarImage}
            contentFit="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <Text style={styles.avatarInitial}>
            {seller.sellerNickname.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.nickname}>{seller.sellerNickname}</Text>
        {location ? <Text style={styles.location}>{location}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 16,
    color: '#EA580C',
  },
  info: {
    gap: 3,
  },
  nickname: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
  },
});
```

- [ ] **Step 5: 타입체크**

Run: `cd mobile && pnpm exec tsc --noEmit`
Expected: 오류 없음

- [ ] **Step 6: 커밋**

```bash
git add mobile/components/product-detail
git commit -m "$(cat <<'EOF'
feat(mobile): 상세 화면 조각 컴포넌트 추가

브레드크럼·이미지 스와이프·요약·판매자 카드. 표시 전용이고 데이터 연결은 다음 과제.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: 상태 화면 + 데이터 연결

**목적:** 상세 화면을 조립하고, 목록 캐시로 즉시 그리기·404·오류를 붙인다.

**Files:**
- Create: `mobile/components/product-detail/detail-states.tsx`
- Modify: `mobile/app/(tabs)/(home)/products/[id].tsx`

**Interfaces:**
- Consumes: Task 6의 네 컴포넌트, `fetchProductDetail`·`ProductNotFoundError` (Task 4)
- Produces: `<DetailSkeleton />`, `<NotFoundState onBack={() => void} />`,
  `<DetailErrorState onRetry={() => void} />`

- [ ] **Step 1: 상태 화면을 만든다**

`mobile/components/product-detail/detail-states.tsx`

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

// 상세 화면의 로딩·없음·오류 상태. 홈의 list-states와 같은 결로 맞춘다.

/** 목록 캐시가 없어 아무것도 못 그릴 때 보이는 회색 자리. */
export function DetailSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={[styles.bar, { width: '40%' }]} />
        <View style={[styles.bar, { width: '80%', height: 22 }]} />
        <View style={[styles.bar, { width: '35%', height: 20 }]} />
        <View style={[styles.bar, { width: '55%' }]} />
      </View>
    </View>
  );
}

/** 삭제되었거나 없는 상품(404). */
export function NotFoundState({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.message}>삭제되었거나 없는 상품이에요</Text>
      <Pressable style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>목록으로</Text>
      </Pressable>
    </View>
  );
}

/** 네트워크·서버 오류. */
export function DetailErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.message}>상품을 불러오지 못했어요</Text>
      <Pressable style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWrap: {
    flex: 1,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#E5E7EB',
  },
  skeletonBody: {
    padding: 16,
    gap: 10,
  },
  bar: {
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  button: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#EA580C',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

- [ ] **Step 2: 상세 화면을 조립한다**

`mobile/app/(tabs)/(home)/products/[id].tsx` 전체를 교체한다.

```tsx
import type { Product, ProductDetailItem } from '@cuddle/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Breadcrumb } from '@/components/product-detail/breadcrumb';
import {
  DetailErrorState,
  DetailSkeleton,
  NotFoundState,
} from '@/components/product-detail/detail-states';
import { ImageCarousel } from '@/components/product-detail/image-carousel';
import { ProductSummary } from '@/components/product-detail/product-summary';
import { SellerCard } from '@/components/product-detail/seller-card';
import { fetchProductDetail, ProductNotFoundError } from '@/lib/products';

// 상품 상세. 읽기 전용.
// 화면 순서는 웹을 모바일 폭으로 줄였을 때와 같다:
//   브레드크럼 → 이미지 → 뱃지·제목·가격·시간·지역 → 판매자 → 설명 → 조회·찜
// 웹과 다른 곳은 한 군데 — 설명을 자체 스크롤 박스에 가두지 않는다(중첩 스크롤 회피).

/** 홈 목록 캐시에서 같은 id의 상품을 찾아, 상세를 즉시 그릴 밑그림으로 쓴다. */
function useListCachePlaceholder(id: number): ProductDetailItem | undefined {
  const queryClient = useQueryClient();
  const pages = queryClient.getQueryData<{ pages: { content: Product[] }[] }>(['products']);
  const found = pages?.pages.flatMap((page) => page.content).find((p) => p.id === id);

  if (!found) return undefined;

  // 목록에 없는 값은 비워 둔다. 상세 응답이 오면 통째로 대체된다.
  return {
    ...found,
    category: '',
    description: '',
    subImageUrls: [],
    addressSido: found.addressSido ?? '',
    addressGugun: found.addressGugun ?? '',
    viewCount: found.viewCount ?? 0,
    sellerInfo: {
      sellerId: 0,
      sellerNickname: '',
      sellerProfileImageUrl: null,
      addressSido: null,
      addressGugun: null,
    },
    sellerOtherProducts: [],
  };
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const productId = Number(id);
  const placeholder = useListCachePlaceholder(productId);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductDetail(productId),
    placeholderData: placeholder,
    // 없는 상품(404)은 다시 시도해도 소용없다.
    retry: (count, err) => !(err instanceof ProductNotFoundError) && count < 2,
  });

  if (error instanceof ProductNotFoundError) {
    return <NotFoundState onBack={() => router.back()} />;
  }
  if (error) {
    return <DetailErrorState onRetry={() => refetch()} />;
  }
  if (isLoading || !data) {
    return <DetailSkeleton />;
  }

  // 상세 응답이 오기 전(밑그림 상태)에는 설명·판매자 칸을 회색 자리로 둔다.
  const isPlaceholder = data.sellerInfo.sellerId === 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {data.category ? (
        <View style={styles.breadcrumbWrap}>
          <Breadcrumb petDetailType={data.petDetailType} category={data.category} />
        </View>
      ) : null}

      <ImageCarousel
        mainImageUrl={data.mainImageUrl}
        subImageUrls={data.subImageUrls}
        tradeStatus={data.tradeStatus}
        productType={data.productType}
      />

      <View style={styles.section}>
        <ProductSummary product={data} />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        {isPlaceholder ? <View style={styles.bar} /> : <SellerCard seller={data.sellerInfo} />}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        {isPlaceholder ? (
          <View style={[styles.bar, { width: '70%' }]} />
        ) : (
          <Text style={styles.description}>{data.description}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.counts}>{`조회 ${data.viewCount} · 찜 ${data.favoriteCount}`}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingBottom: 32,
  },
  breadcrumbWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
  },
  counts: {
    fontSize: 13,
    color: '#6B7280',
  },
  bar: {
    height: 40,
    width: '45%',
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
});
```

- [ ] **Step 3: 타입체크와 테스트**

Run: `cd mobile && pnpm exec tsc --noEmit`
Expected: 오류 없음

Run: `cd mobile && pnpm test`
Expected: PASS

- [ ] **Step 4: 실기기에서 네 가지 경우를 확인한다**

Run: `cd mobile && pnpm expo start`

| 경우 | 확인할 것 |
|---|---|
| 목록에서 판매(SELL) 상품 탭 | 사진·제목·가격이 **로딩 없이 바로** 보이고, 설명·판매자만 잠깐 회색 |
| 판매요청 + 거래상태 null 상품 | 뱃지가 주황 `판매요청`, 오버레이 **없음** |
| 서브이미지가 있는 상품 (id=60) | 가로로 밀면 두 번째 사진, 아래 점 2개 |
| 앱을 껐다 켠 뒤 바로 상세 진입 | 전체 스켈레톤 후 화면이 채워짐 |

- [ ] **Step 5: 커밋**

```bash
git add mobile/components/product-detail/detail-states.tsx "mobile/app/(tabs)/(home)/products/[id].tsx"
git commit -m "$(cat <<'EOF'
feat(mobile): 상품 상세 화면 완성

목록 캐시를 placeholderData로 써서 진입 즉시 사진·제목·가격을 그리고,
상세 응답이 오면 설명·판매자를 채운다. 404는 전용 안내, 그 외 오류는 재시도.
설명은 웹과 달리 본문에 펼친다(중첩 스크롤 회피).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: 통합 검증과 마무리

**목적:** 웹·앱·테스트를 한 번에 다시 확인하고, 남은 항목을 문서에 남긴다.

**Files:**
- Modify: `docs/superpowers/specs/2026-07-23-rn-product-detail-design.md` (실제와 달라진 점이 있으면)

- [ ] **Step 1: 전체 게이트를 순서대로 돌린다**

```bash
pnpm --filter @cuddle/shared test      # Vitest
cd mobile && pnpm test                 # Jest
cd mobile && pnpm exec tsc --noEmit    # 앱 타입체크
cd .. && pnpm build                    # 웹 빌드 (가장 중요)
```

Expected: 넷 다 성공. 하나라도 실패하면 고치기 전에는 다음 단계로 가지 않는다.

- [ ] **Step 2: 배관이 여전히 살아 있는지 다시 증명한다**

Task 1의 마커 검증을 한 번 더 한다 (표식 심기 → 웹 화면 확인 → 지우기).
그동안 여러 파일이 바뀌었으므로 연결이 끊기지 않았는지 확인하는 것이다.

- [ ] **Step 3: 삭제된 상품으로 404 화면을 확인한다**

앱에서 임시로 `/products/55` 로 들어가 본다 (실측상 이 id는 404).
Expected: "삭제되었거나 없는 상품이에요" + [목록으로] 버튼, 버튼을 누르면 목록으로 돌아온다.

- [ ] **Step 4: 비행기 모드로 오류 화면을 확인한다**

기기를 비행기 모드로 바꾸고 앱을 껐다 켠 뒤 상세로 들어간다.
Expected: "상품을 불러오지 못했어요" + [다시 시도]. 비행기 모드를 풀고 누르면 화면이 채워진다.

- [ ] **Step 5: 설계 문서와 실제가 다르면 문서를 고친다**

구현하며 달라진 결정이 있으면 설계 문서에 반영한다. 없으면 넘어간다.

- [ ] **Step 6: 최종 커밋과 푸시**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: 상품 상세 통합 검증 반영

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
git push -u origin feat/rn-product-detail
```

> PR은 사용자가 요청할 때만 만든다. base는 **`develop`** 이다.

---

## 남은 것 (다음 바퀴)

설계 문서 §8과 같은 내용이다. 이 계획에는 들어 있지 않다.

- 웹의 나머지 중복을 shared로 갈아끼우기 — `getTimeAgo`(11개 파일), `PETS`·`PET_DETAILS`,
  `PRODUCT_CATEGORIES`, `PRODUCT_TYPE_TABS`, `CONDITION_ITEMS`
- 재수출 껍데기(`src/lib/utils/formatPrice.ts`) 걷어내기
- 찜 · 채팅하기 · 신고하기 (로그인 루프)
- 판매자의 다른 상품
- 브레드크럼 링크 연결 (홈 필터 루프)
- 실기기에서 보고 정할 것: 판매자 카드 위치, 버튼 위치(본문 vs 하단 고정), 사진 좌우 여백,
  탭바 스크롤 숨김
