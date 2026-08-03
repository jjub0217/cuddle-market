# 앱 상품 등록·수정·삭제 구현 계획 (11바퀴)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에서 상품을 올리고 고치고 지울 수 있게 한다. 그러려면 사진 업로드 길을 처음 뚫어야 한다.

**Architecture:** 사진은 사진첩에서 여러 장 고르고 **한 장씩** 서버로 보낸다. 폼에는 주소 문자열만 남는다. 등록과 수정이 같은 폼 조각을 나눠 쓴다(서버가 전체 교체를 요구하므로 보내는 모양이 어차피 같다). 고를 수 있는 값 목록은 `@cuddle/shared`에 두고 웹·앱이 같이 쓴다.

**Tech Stack:** Expo SDK 54 · React Native 0.81.5 · React 19.1.0 · expo-image-picker · expo-image-manipulator · TanStack Query · Jest(앱) · vitest(shared·웹)

설계: `docs/superpowers/specs/2026-08-03-app-product-post-design.md` · 이슈 #826

## Global Constraints

- 앱은 **Expo SDK 54 · RN 0.81.5 · React 19.1.0** 고정. 꾸러미를 더할 때는 `npx expo install`을 쓴다(`pnpm add`는 SDK에 안 맞는 버전을 가져온다).
- 화면 문구는 **새로 짓지 않는다.** 웹의 같은 화면에서 그대로 가져온다. 웹에도 없으면 리드에게 묻는다.
- **사진은 한 장씩 보낸다.** 요청 하나에 여러 장을 담지 않는다.
- **수정은 전체 교체다.** 안 바꾼 값도 전부 다시 보낸다.
- 커밋은 리드가 한다. 팬(병렬 에이전트)은 **git 명령을 쓰지 않는다**(`.git/index.lock` 충돌).
- 셸에서 `;` 말고 `&&`를 쓴다.
- 게이트: `pnpm gate:shared` · `pnpm gate:mobile` · `pnpm gate` (전부 저장소 루트에서).
- `mobile/AGENTS.md`의 「걸렸던 함정」 표를 먼저 읽는다. 특히 **RTL 14는 `render`·`rerender`·`fireEvent`를 전부 `await` 해야 한다** — 안 하면 오류 없이 옛 값을 준다.

## 서버가 정한 값 (스펙 §3에서 옮김 — 지어내지 말 것)

```
사진 올리기   POST /api/images   multipart · 필드 이름 files · 로그인 필요
              최대 5장 · 한 장 5MB · ⚠️ 운영 설정이 요청 전체를 5MB로 막는다
              응답 { data: { imageUrls, mainImageUrl, subImageUrls } }
              ⚠️ 한 장만 올리면 subImageUrls가 null

상품 등록     POST   /api/products         → 201
상품 수정     PATCH  /api/products/{id}    → 200 · 전체 교체
상품 삭제     DELETE /api/products/{id}    → 200 · data는 null
```

**요청 필드** (등록·수정 동일)

| 필드 | 타입 | 서버 필수 | 제약 |
|---|---|---|---|
| `petType` | enum | ✅ | `MAMMAL BIRD REPTILE FISH AMPHIBIAN AMPHIBIAN_REAL RODENT CRUSTACEAN PLANT ETC` |
| `petDetailType` | enum | ✅ | 41개 (웹 `PETS`의 `details`) |
| `category` | enum | ✅ | `FOOD TOY HOUSE CLOTHING HEALTH GROOMING WALKING ETC` |
| `title` | String | ✅ | 2~50자 |
| `description` | String | — | 최대 1,000자 |
| `price` | Long | ✅ | 0 이상 |
| `productStatus` | enum | ✅ | `NEW LIKE_NEW USED NEED_REPAIR` |
| `mainImageUrl` | String | — | — |
| `subImageUrls` | String[] | — | 최대 4장 |
| `addressSido` | String | ✅ | — |
| `addressGugun` | String | ✅ | — |

> ⚠️ **서버는 설명을 선택으로 받지만 웹은 필수로 막는다**(`productPostValidationRules.description`에 `required`가 있다). **앱은 웹을 따른다** — 같은 화면이 두 곳에서 다르게 굴면 안 된다.

## 웹에서 그대로 가져올 문구 (한 글자도 바꾸지 말 것)

```
검사 문구
  상품명을 입력해주세요
  상품명은 2~ 50자 이하이어야 합니다.        ← 「2~ 50」의 띄어쓰기까지 웹 그대로다
  상품설명을 입력해주세요
  상품설명은 2 ~ 1000자 이하이어야 합니다.
  가격을 입력해주세요
  가격은 0원 이상이어야 합니다
  카테고리를 선택해주세요
  상품 상태를 선택해주세요
  지역을 선택해주세요

이름표·안내
  상품 사진
  첫번째 이미지가 대표 이미지가 됩니다. 드래그 또는 클릭으로 최대 5장 업로드 (각 5MB 이하)
  이미지 등록
  대표
  상품명
  예: 강아지 사료 10kg 상품
  반려동물 종류
  대분류를 선택해주세요(예: 포유류)
  소분류를 선택해주세요
  먼저 대분류를 선택해주세요
  카테고리를 선택해주세요
  판매 가격
  상품 설명
  상품의 상태, 구매 시기, 사용 빈도, 특징 등을 자세히 적어주세요
  거래 희망 지역
  시/도를 선택해주세요                        ← 앱 address-field.tsx에서
  수정 완료

사진 오류
  파일 크기는 5MB를 초과할 수 없습니다.
  지원하지 않는 파일 형식입니다. (jpg, jpeg, png, webp만 가능)
  이미지 업로드에 실패했습니다. 다시 시도해주세요.
  최대 5개의 파일만 업로드할 수 있습니다.

등록·수정·삭제 실패
  상품 등록에 실패했습니다.
  상품 수정에 실패했습니다.
  상품 삭제에 실패했습니다.

삭제 확인 창
  제목    상품 삭제
  설명    정말로 이 상품을 삭제하시겠습니까?
  주의    삭제된 상품은 복구할 수 없습니다
  단추    취소 · 삭제하기
```

> ⚠️ 앱의 화면 제목은 웹과 다르다. 웹은 「판매 상품 등록」인데 **앱 헤더에는 「상품 등록」**을 쓴다 — 앱은 판매 요청을 안 만들어서 「판매 상품」이라고 구별할 이유가 없다. 이 하나는 리드가 정한 예외다.

## 파일 구조

```
packages/shared/
  src/constants/productOptions.ts        고를 수 있는 값 목록 (웹·앱 공용)
  src/constants/productOptions.test.ts

mobile/lib/
  auth/api.ts                 [고침] FormData면 Content-Type을 비운다
  auth/api.test.ts            [새로] 그 분기를 지키는 시험
  product-images.ts           [새로] 줄이기 + 한 장씩 올리기
  product-images.test.ts
  product-form.ts             [새로] 유효성 검사 (순수 함수)
  product-form.test.ts
  products.ts                 [고침] createProduct · updateProduct · deleteProduct
  products.test.ts            [새로]
  product-menu.ts             [고침] ⋮ 에 수정하기·삭제 더하기
  product-menu.test.ts        [고침]

mobile/components/
  products/product-form.tsx   [새로] 등록·수정이 나눠 쓰는 폼
  products/image-field.tsx    [새로] 사진 고르기·미리보기·대표 지정
  products/picker-field.tsx   [새로] 값 하나 고르기 (시트를 엶)
  products/region-field.tsx   [새로] 시도·구군 (아래 signup에서 뽑아낸 것을 씀)
  signup/address-field.tsx    [고침] 폼 훅에 안 묶이게 일반화

mobile/app/
  products/new.tsx            [새로] 등록 화면
  products/[id]/edit.tsx      [새로] 수정 화면
  _layout.tsx                 [고침] 위 둘을 루트 스택에 등록
  (tabs)/(home)/index.tsx     [고침] 떠 있는 「+ 상품 등록」
  (tabs)/(home)/products/[id].tsx  [고침] 내 상품이면 ⋮ 에 수정·삭제
  (tabs)/(my)/my-products.tsx      [고침] ⋮ 에 수정·삭제

src/ (웹)
  constants/constants.ts                                   [고침] shared 목록을 다시 내보낸다
  features/product-detail/components/ProductActions.tsx    [고침] 단추 줄 정리
```

## 과제 순서와 나눌 수 있는 것

```
Task 1   shared 목록          ← 아무도 아직 안 쓴다. 혼자 갈 수 있다
Task 2   웹이 shared를 쓰게    ← Task 1 뒤
Task 3   apiFetch FormData    ← 혼자 갈 수 있다. **사진의 갈림길**
Task 4   사진 줄이기·올리기     ← Task 3 뒤
Task 5   유효성 검사           ← 혼자 갈 수 있다
Task 6   상품 API 셋           ← 혼자 갈 수 있다
Task 7   AddressField 일반화   ← 혼자 갈 수 있다
Task 8   폼 조각들             ← Task 1·5·7 뒤
Task 9   등록 화면 + 떠 있는 단추 ← Task 4·6·8 뒤
Task 10  수정 화면             ← Task 9 뒤
Task 11  삭제                  ← Task 6 뒤
Task 12  웹 상세 단추 줄        ← 혼자 갈 수 있다
Task 13  실기기 확인 (사용자)   ← 마지막
```

**나란히 돌릴 수 있는 묶음**: `{1, 3, 5, 6, 7, 12}` → `{2, 4}` → `{8}` → `{9, 11}` → `{10}` → `{13}`

**리드가 할 일**: 매 묶음마다 직접 게이트를 돌리고, 「⚠️」로 경고한 자리를 눈으로 확인한다. **팬은 계획을 의심하지 않는다** — 10바퀴에 계획서의 틀린 값(칩 문구)이 그대로 재현됐다.

---

# Task 1: shared에 고를 수 있는 값 목록

**Files:**
- Create: `packages/shared/src/constants/productOptions.ts`
- Create: `packages/shared/src/constants/productOptions.test.ts`
- Modify: `packages/shared/src/index.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `PET_TYPE_OPTIONS` · `PET_DETAIL_OPTIONS_BY_TYPE` · `CATEGORY_OPTIONS` · `PRODUCT_STATUS_OPTIONS` · `type Option = { code: string; label: string }`

**왜 필요한가**: 지금 shared의 라벨은 **코드 → 한글 한 방향**뿐이라(`getCategoryLabel('FOOD') → '사료·간식'`) 폼에서 고를 목록을 만들 수 없다. 값이 웹 `constants.ts`에만 있어 앱이 베끼면 두 벌이 된다.

- [ ] **Step 1: 웹의 원본 값을 그대로 읽어 온다**

```bash
sed -n '23,135p' src/constants/constants.ts    # PETS (종류 안에 세부 종류)
grep -n -A12 "PRODUCT_CATEGORIES" src/constants/constants.ts
grep -n -A8 "CONDITION_ITEMS" src/constants/constants.ts
```

⚠️ **여기서 읽은 코드값·한글을 한 글자도 바꾸지 마라.** 서버 enum과 정확히 맞아야 한다.

- [ ] **Step 2: 시험을 먼저 쓴다**

`packages/shared/src/constants/productOptions.test.ts`

```ts
import { describe, expect, it } from 'vitest'

import {
  CATEGORY_OPTIONS,
  PET_DETAIL_OPTIONS_BY_TYPE,
  PET_TYPE_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
} from './productOptions'
import { getCategoryLabel, getPetDetailLabel } from '../lib/petLabels'
import { getProductStatusLabel } from '../lib/productLabels'

// 폼에서 고를 목록. 지금까지 있던 라벨 맵은 코드→한글 한 방향이라 목록을 못 만들었다.
//
// ⚠️ 값은 서버 enum과 정확히 같아야 한다. 하나라도 어긋나면 등록이 400으로 막힌다.

describe('카테고리', () => {
  it('서버 enum 여덟 개를 다 담는다', () => {
    // 순서는 화면이 정하는 것이라 안 본다. 무엇이 들어 있는지만 본다
    expect(CATEGORY_OPTIONS.map((o) => o.code).sort()).toEqual(
      ['CLOTHING', 'ETC', 'FOOD', 'GROOMING', 'HEALTH', 'HOUSE', 'TOY', 'WALKING'].sort()
    )
  })

  it('라벨이 기존 라벨 맵과 같다', () => {
    // 같은 코드가 목록에서와 상세에서 다른 이름으로 보이면 안 된다
    for (const option of CATEGORY_OPTIONS) {
      expect(option.label).toBe(getCategoryLabel(option.code))
    }
  })
})

describe('상품 상태', () => {
  it('서버 enum 넷을 다 담는다', () => {
    expect(PRODUCT_STATUS_OPTIONS.map((o) => o.code).sort()).toEqual(
      ['LIKE_NEW', 'NEED_REPAIR', 'NEW', 'USED'].sort()
    )
  })

  it('라벨이 기존 라벨 맵과 같다', () => {
    for (const option of PRODUCT_STATUS_OPTIONS) {
      expect(option.label).toBe(getProductStatusLabel(option.code))
    }
  })
})

describe('펫 종류', () => {
  it('서버 enum 열 개를 다 담는다', () => {
    expect(PET_TYPE_OPTIONS.map((o) => o.code).sort()).toEqual(
      [
        'AMPHIBIAN',
        'AMPHIBIAN_REAL',
        'BIRD',
        'CRUSTACEAN',
        'ETC',
        'FISH',
        'MAMMAL',
        'PLANT',
        'REPTILE',
        'RODENT',
      ].sort()
    )
  })

  it('종류마다 세부 종류가 하나 이상 있다', () => {
    // 세부가 빈 종류를 고르면 다음 칸에서 고를 게 없어 막힌다
    for (const type of PET_TYPE_OPTIONS) {
      expect(PET_DETAIL_OPTIONS_BY_TYPE[type.code]?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('세부 종류를 다 합치면 41개다', () => {
    const all = Object.values(PET_DETAIL_OPTIONS_BY_TYPE).flat()
    expect(all).toHaveLength(41)
  })

  it('세부 종류 코드가 겹치지 않는다', () => {
    // 같은 코드가 두 종류에 걸쳐 있으면 어느 쪽으로 되돌릴지 알 수 없다
    const codes = Object.values(PET_DETAIL_OPTIONS_BY_TYPE)
      .flat()
      .map((o) => o.code)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('세부 라벨이 기존 라벨 맵과 같다', () => {
    for (const option of Object.values(PET_DETAIL_OPTIONS_BY_TYPE).flat()) {
      expect(option.label).toBe(getPetDetailLabel(option.code))
    }
  })
})
```

- [ ] **Step 3: 빨간 것을 확인한다**

```bash
pnpm gate:shared
```

기대: `Cannot find module './productOptions'`

- [ ] **Step 4: 목록을 만든다**

`packages/shared/src/constants/productOptions.ts`

```ts
// 폼에서 **고를** 목록. 웹·앱이 같이 쓴다.
//
// lib/petLabels·productLabels의 맵은 코드 → 한글 **한 방향**이라 읽을 때만 쓸 수 있다.
// 여기는 반대로 「무엇을 고를 수 있나」를 준다.
//
// ⚠️ 코드값은 서버 enum과 정확히 같아야 한다. 하나라도 어긋나면 등록이 400으로 막힌다.
//    근거: 웹 constants.ts의 PETS · PRODUCT_CATEGORIES · CONDITION_ITEMS

export interface Option {
  /** 서버로 보내는 값 */
  code: string
  /** 화면에 보이는 한글 */
  label: string
}

export const PET_TYPE_OPTIONS: readonly Option[] = [
  // …웹 constants.ts의 PETS에서 code·name을 그대로 옮긴다
]

/** 종류를 고르면 그 안의 것만 고를 수 있다. 종류를 바꾸면 세부를 비워야 한다 */
export const PET_DETAIL_OPTIONS_BY_TYPE: Readonly<Record<string, readonly Option[]>> = {
  // …PETS의 details를 종류 코드별로 옮긴다
}

export const CATEGORY_OPTIONS: readonly Option[] = [
  // …PRODUCT_CATEGORIES에서 옮긴다
]

export const PRODUCT_STATUS_OPTIONS: readonly Option[] = [
  // …CONDITION_ITEMS에서 옮긴다
]
```

⚠️ 위 주석 자리에 **웹에서 읽은 실제 값을 채워 넣어라.** 지어내지 마라 — Step 1에서 읽은 것을 그대로 옮긴다.

- [ ] **Step 5: index.ts에서 내보낸다**

`packages/shared/src/index.ts`에 한 줄 더한다.

```ts
export * from './constants/productOptions'
```

- [ ] **Step 6: 초록을 확인한다**

```bash
pnpm gate:shared
```

기대: 전부 통과. 시험 수가 늘어 있어야 한다.

- [ ] **Step 7: 리드에게 보고**

목록 넷의 개수와, 웹 어느 줄에서 옮겼는지(파일:줄)를 적어 보고한다.

---

# Task 2: 웹이 shared 목록을 쓰게

**Files:**
- Modify: `src/constants/constants.ts`

**Interfaces:**
- Consumes: `CATEGORY_OPTIONS` · `PRODUCT_STATUS_OPTIONS` · `PET_TYPE_OPTIONS` · `PET_DETAIL_OPTIONS_BY_TYPE` (Task 1)
- Produces: 없음 (웹 화면은 그대로 돈다)

**왜 필요한가**: 값이 두 곳에 있으면 두 곳이 어긋난다. 2026-08-02에 답글 깊이 규칙과 알림 시각 표기에서 **웹·앱이 똑같이 틀린** 일을 겪었다.

- [ ] **Step 1: 지금 웹이 그 값들을 어디서 어떻게 쓰는지 센다**

```bash
grep -rn "PETS\|PRODUCT_CATEGORIES\|CONDITION_ITEMS" src/ --include="*.tsx" --include="*.ts" | grep -v constants.ts
```

⚠️ **모양이 다르면 함부로 바꾸지 마라.** 웹이 `{ code, name }`을 쓰는데 shared가 `{ code, label }`이면, `constants.ts`에서 **모양을 맞춰 다시 내보내는** 쪽이 안전하다. 화면 파일을 여럿 고치는 것보다 한 곳에서 바꾸는 것이 낫다.

- [ ] **Step 2: constants.ts가 shared 값을 쓰게 한다**

`src/constants/constants.ts`

```ts
import {
  CATEGORY_OPTIONS,
  PET_DETAIL_OPTIONS_BY_TYPE,
  PET_TYPE_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
} from '@cuddle/shared'

// 값의 원본은 이제 packages/shared다. 웹·앱이 같은 목록을 쓴다.
// 여기서는 웹 화면이 쓰던 모양({ code, name })으로 맞춰 다시 내보내기만 한다 —
// 화면 파일을 여럿 고치는 것보다 한 곳에서 바꾸는 편이 덜 깨진다.
export const PETS = PET_TYPE_OPTIONS.map((type) => ({
  code: type.code,
  name: type.label,
  details: (PET_DETAIL_OPTIONS_BY_TYPE[type.code] ?? []).map((detail) => ({
    code: detail.code,
    name: detail.label,
  })),
}))
```

⚠️ `PRODUCT_CATEGORIES`·`CONDITION_ITEMS`도 **지금 웹이 쓰는 모양 그대로** 맞춰 다시 내보내라. Step 1에서 확인한 필드 이름을 쓴다.

- [ ] **Step 3: 웹 게이트**

```bash
pnpm gate
```

기대: 전부 통과. 타입 오류가 나면 **모양이 안 맞는 것**이니 Step 2로 돌아간다.

- [ ] **Step 4: 눈으로 확인 (리드)**

```bash
pnpm dev
```

```
□ 상품 등록 화면의 카테고리 목록이 그대로다
□ 펫 종류를 고르면 세부 종류가 그에 맞게 좁혀진다
□ 상품 상태 목록이 그대로다
□ 상품 목록의 거르개(카테고리·펫)가 그대로다
```

- [ ] **Step 5: 리드에게 보고**

`PETS`·`PRODUCT_CATEGORIES`·`CONDITION_ITEMS` 말고 **다른 곳에서도 그 값들을 쓰고 있었는지**, 있었다면 어떻게 했는지 적어 보고한다.

---

# Task 3: apiFetch가 사진도 보낼 수 있게 ← **이번 바퀴의 갈림길**

**Files:**
- Modify: `mobile/lib/auth/api.ts:81-88`
- Create: `mobile/lib/auth/api.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `apiFetch(path, init)` — `init.body`가 `FormData`면 `Content-Type`을 안 붙인다

**왜 이게 먼저인가**: 안 고치면 사진이 **조용히** 안 올라간다. 원인을 찾기 아주 어려운 자리라 시험으로 못 박고 시작한다.

- [ ] **Step 1: 지금 코드를 읽는다**

```bash
sed -n '75,105p' mobile/lib/auth/api.ts
```

`send()` 안에서 `'Content-Type': 'application/json'`이 **늘** 붙는다. 사진은 multipart로 보내야 하는데, 그때는 런타임이 경계 문자열(boundary)을 붙여 **스스로** 정해야 한다. 우리가 정하면 서버가 본문을 못 가른다.

⚠️ 34번째 줄에도 같은 문구가 있지만 그건 **토큰 갱신 전용**이라 늘 JSON이 맞다. **건드리지 마라.**

- [ ] **Step 2: 시험을 먼저 쓴다**

`mobile/lib/auth/api.test.ts`

```ts
import { apiFetch } from './api';
import { useAuthStore } from './store';

// 사진을 보낼 때 Content-Type을 우리가 정하면 안 된다.
// 런타임이 경계 문자열(boundary)을 붙여 스스로 정해야 서버가 본문을 가를 수 있다.
//
// 이 시험이 없으면 사진이 **조용히** 안 올라가고 원인을 찾기 아주 어렵다.

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ status: 200, ok: true });
  global.fetch = fetchMock as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'token-abc', refreshToken: 'r' });
});

/** fetch에 실제로 넘어간 헤더 */
function sentHeaders(): Record<string, string> {
  return fetchMock.mock.calls[0][1].headers as Record<string, string>;
}

describe('본문 종류에 따라 Content-Type을 가른다', () => {
  it('JSON을 보낼 때는 붙인다', async () => {
    await apiFetch('/products', { method: 'POST', body: JSON.stringify({ a: 1 }) });

    expect(sentHeaders()['Content-Type']).toBe('application/json');
  });

  it('본문이 없어도 붙인다', async () => {
    // 지금까지 돌던 GET들이 그대로 돌아야 한다
    await apiFetch('/products');

    expect(sentHeaders()['Content-Type']).toBe('application/json');
  });

  it('FormData를 보낼 때는 **안** 붙인다', async () => {
    const form = new FormData();
    form.append('files', { uri: 'file:///a.webp', name: 'a.webp', type: 'image/webp' } as never);

    await apiFetch('/images', { method: 'POST', body: form });

    expect(sentHeaders()['Content-Type']).toBeUndefined();
  });

  it('FormData여도 토큰은 붙인다', async () => {
    // 사진 올리기는 로그인이 필요하다
    const form = new FormData();

    await apiFetch('/images', { method: 'POST', body: form });

    expect(sentHeaders().Authorization).toBe('Bearer token-abc');
  });
});
```

- [ ] **Step 3: 빨간 것을 확인한다**

```bash
pnpm gate:mobile
```

기대: 「FormData를 보낼 때는 안 붙인다」가 실패. `Received: "application/json"`

- [ ] **Step 4: 고친다**

`mobile/lib/auth/api.ts`의 `send()`

```ts
  const send = (token: string | null) => {
    // 사진을 보낼 때는 Content-Type을 우리가 정하면 안 된다.
    // multipart는 본문을 가르는 경계 문자열(boundary)이 헤더에 들어가는데,
    // 그 값은 런타임이 만든다. 우리가 'multipart/form-data'라고만 적으면
    // 경계가 없어 서버가 본문을 못 가른다.
    const isForm = init.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...((init.headers as Record<string, string> | undefined) ?? {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
  };
```

- [ ] **Step 5: 초록을 확인한다**

```bash
pnpm gate:mobile
```

기대: 전부 통과. **기존 시험이 하나도 안 깨져야 한다** — JSON을 보내던 곳은 `isForm`이 거짓이라 예전과 똑같이 돈다.

- [ ] **Step 6: 표식으로 확인한다 (리드)**

고침을 되돌려 그 시험만 빨개지는지 본다.

```bash
cp mobile/lib/auth/api.ts /tmp/api.bak
# isForm 분기를 지우고 늘 'application/json'을 붙이게 되돌린다
cd mobile && npx jest auth/api
cd .. && cp /tmp/api.bak mobile/lib/auth/api.ts && rm /tmp/api.bak
```

기대: 「FormData를 보낼 때는 안 붙인다」만 실패.

- [ ] **Step 7: 리드에게 보고**

기존 시험이 하나도 안 깨졌는지, 표식 결과가 어땠는지 적어 보고한다.

---

# Task 4: 사진 줄이기 + 한 장씩 올리기

**Files:**
- Create: `mobile/lib/product-images.ts`
- Create: `mobile/lib/product-images.test.ts`
- Modify: `mobile/package.json` (꾸러미 둘)

**Interfaces:**
- Consumes: `apiFetch` (Task 3 — FormData를 받을 수 있어야 한다)
- Produces:
  - `type PickedImage = { uri: string }`
  - `type UploadSlot = { key: string; localUri: string; url: string | null; failed: boolean }`
  - `pickImages(remaining: number): Promise<PickedImage[]>`
  - `shrinkImage(uri: string): Promise<string>`
  - `uploadOne(uri: string): Promise<string>`
  - `makeMain(slots: UploadSlot[], key: string): UploadSlot[]`
  - `toImageUrls(slots: UploadSlot[]): { mainImageUrl: string | null; subImageUrls: string[] }`

- [ ] **Step 1: 꾸러미를 넣는다**

```bash
cd mobile && npx expo install expo-image-picker expo-image-manipulator
```

⚠️ **`pnpm add`를 쓰지 마라.** SDK 54에 안 맞는 버전이 들어와 실기기에서 안 뜬다. 넣은 뒤 실제 버전을 보고에 적어라.

- [ ] **Step 2: 라이브러리가 무엇을 주는지 **직접 확인한다****

```bash
grep -rn "launchImageLibraryAsync\|MediaType" mobile/node_modules/expo-image-picker/build/ImagePicker.d.ts | head
grep -rn "manipulateAsync\|SaveFormat\|ImageManipulator" mobile/node_modules/expo-image-manipulator/build/*.d.ts | head
```

⚠️ **아래 코드의 함수 이름·옵션 이름은 짐작으로 적은 것이다.** SDK 54에서 실제 이름이 다르면 **파일 쪽이 맞다.** 확인한 이름으로 고쳐 쓰고, 무엇이 달랐는지 보고하라.

- [ ] **Step 3: 순수 로직 시험을 먼저 쓴다**

`mobile/lib/product-images.test.ts`

```ts
import { makeMain, toImageUrls, type UploadSlot } from './product-images';

// 사진 목록을 다루는 규칙만 본다. 사진첩을 열거나 실제로 올리는 것은 실기기에서 본다.

function slot(key: string, url: string | null, failed = false): UploadSlot {
  return { key, localUri: `file:///${key}.jpg`, url, failed };
}

describe('대표 고르기', () => {
  // 웹은 끌어서 순서를 바꾸지만 앱은 눌러서 대표를 정한다.
  // 맨 앞이 곧 mainImageUrl이다.

  it('누른 사진이 맨 앞으로 온다', () => {
    const slots = [slot('a', 'A'), slot('b', 'B'), slot('c', 'C')];

    expect(makeMain(slots, 'c').map((s) => s.key)).toEqual(['c', 'a', 'b']);
  });

  it('나머지 차례는 그대로다', () => {
    const slots = [slot('a', 'A'), slot('b', 'B'), slot('c', 'C'), slot('d', 'D')];

    expect(makeMain(slots, 'c').map((s) => s.key)).toEqual(['c', 'a', 'b', 'd']);
  });

  it('이미 맨 앞이면 그대로다', () => {
    const slots = [slot('a', 'A'), slot('b', 'B')];

    expect(makeMain(slots, 'a').map((s) => s.key)).toEqual(['a', 'b']);
  });

  it('없는 것을 누르면 그대로다', () => {
    const slots = [slot('a', 'A'), slot('b', 'B')];

    expect(makeMain(slots, 'zzz').map((s) => s.key)).toEqual(['a', 'b']);
  });
});

describe('서버에 보낼 모양으로', () => {
  it('맨 앞이 대표, 나머지가 추가', () => {
    const slots = [slot('a', 'A'), slot('b', 'B'), slot('c', 'C')];

    expect(toImageUrls(slots)).toEqual({ mainImageUrl: 'A', subImageUrls: ['B', 'C'] });
  });

  it('한 장이면 추가는 빈 배열', () => {
    expect(toImageUrls([slot('a', 'A')])).toEqual({ mainImageUrl: 'A', subImageUrls: [] });
  });

  it('사진이 없으면 대표가 null', () => {
    // 서버는 사진 없는 상품도 받는다(mainImageUrl의 @NotBlank이 주석 처리돼 있다)
    expect(toImageUrls([])).toEqual({ mainImageUrl: null, subImageUrls: [] });
  });

  it('아직 안 올라갔거나 실패한 것은 뺀다', () => {
    // 올라가는 중인 사진의 주소를 보내면 서버가 못 읽는다
    const slots = [slot('a', 'A'), slot('b', null), slot('c', null, true), slot('d', 'D')];

    expect(toImageUrls(slots)).toEqual({ mainImageUrl: 'A', subImageUrls: ['D'] });
  });

  it('맨 앞이 아직 안 올라갔으면 그다음 올라간 것이 대표다', () => {
    const slots = [slot('a', null), slot('b', 'B')];

    expect(toImageUrls(slots)).toEqual({ mainImageUrl: 'B', subImageUrls: [] });
  });
});
```

- [ ] **Step 4: 빨간 것을 확인한다**

```bash
pnpm gate:mobile
```

기대: `Cannot find module './product-images'`

- [ ] **Step 5: 만든다**

`mobile/lib/product-images.ts`

```ts
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { apiFetch } from './auth/api';

// 사진 고르기 → 줄이기 → **한 장씩** 올리기.
//
// 왜 한 장씩인가: 용량 때문이 아니라 **폰은 전파가 자주 끊기기 때문**이다.
// 한꺼번에 보내면 지하철에서 한 번 끊길 때 다섯 장을 다시 골라야 한다.
// 한 장씩이면 끊긴 그 한 장만 다시 누르면 되고, 올라간 것부터 미리보기가 뜬다.
//
// ⚠️ 고르기는 여러 장이다. 사용자는 사진첩에서 여러 장을 한 번에 고른다 —
//    한 장씩인 것은 **보내는 방식**뿐이라 사용자 눈에는 안 보인다.

/** 서버가 받는 최대 장수. ImageUploadService.MAX_FILE_COUNT와 같은 값 */
export const MAX_IMAGES = 5;

/** 줄이는 크기. 웹 browser-image-compression과 같은 값(maxWidthOrHeight: 800) */
const TARGET_WIDTH = 800;

export interface PickedImage {
  uri: string;
}

/** 화면에 그릴 사진 한 칸. 올라가기 전에도 미리보기를 띄우려고 지역 주소를 함께 들고 있다 */
export interface UploadSlot {
  /** 목록에서 이 칸을 가려내는 값. 지역 주소는 겹칠 수 있어 따로 둔다 */
  key: string;
  /** 폰 안의 주소. 올라가기 전 미리보기에 쓴다 */
  localUri: string;
  /** 서버 주소. 아직 안 올라갔으면 null */
  url: string | null;
  /** 올리다 실패했나. 그 자리에만 「다시」를 그린다 */
  failed: boolean;
}

/**
 * 사진첩을 연다.
 * @param remaining 앞으로 더 고를 수 있는 장수 (이미 있는 것을 뺀 값)
 */
export async function pickImages(remaining: number): Promise<PickedImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 1, // 줄이는 건 아래 shrinkImage가 한다. 여기서 두 번 줄이면 더 뭉개진다
  });

  if (result.canceled) return [];
  return result.assets.map((asset) => ({ uri: asset.uri }));
}

/**
 * 사진을 줄인다. 가로 800px · webp.
 *
 * ⚠️ 이걸 안 하면 폰 사진이 3~8MB라 서버가 거절한다(한 장 5MB 제한).
 *    webp로 바꾸는 덤: 아이폰 기본 형식인 HEIC는 서버 허용 목록에 없는데 여기서 풀린다.
 */
export async function shrinkImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: TARGET_WIDTH } }], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.WEBP,
  });
  return result.uri;
}

/**
 * 사진 한 장을 서버에 올리고 주소를 돌려준다.
 *
 * ⚠️ 필드 이름은 `files`다(ImageController의 @RequestParam("files")).
 * ⚠️ apiFetch가 FormData를 알아보고 Content-Type을 안 붙인다(Task 3).
 *    직접 붙이면 경계 문자열이 빠져 서버가 본문을 못 가른다.
 */
export async function uploadOne(uri: string): Promise<string> {
  const form = new FormData();
  form.append('files', {
    uri,
    name: `photo-${uri.split('/').pop() ?? 'image'}.webp`,
    type: 'image/webp',
  } as unknown as Blob);

  const res = await apiFetch('/images', { method: 'POST', body: form });
  if (!res.ok) throw new Error('이미지 업로드에 실패했습니다. 다시 시도해주세요.');

  const body = (await res.json()) as { data?: { mainImageUrl?: string } };
  const url = body.data?.mainImageUrl;
  // 한 장만 보냈으므로 mainImageUrl에 그 한 장이 온다(subImageUrls는 null이다)
  if (!url) throw new Error('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
  return url;
}

/** 누른 사진을 맨 앞으로. 맨 앞이 곧 mainImageUrl이다 */
export function makeMain(slots: UploadSlot[], key: string): UploadSlot[] {
  const target = slots.find((slot) => slot.key === key);
  if (!target) return slots;
  return [target, ...slots.filter((slot) => slot.key !== key)];
}

/**
 * 서버에 보낼 모양으로 바꾼다.
 *
 * ⚠️ 아직 안 올라갔거나 실패한 칸은 뺀다. 그 주소는 폰 안의 것이라 서버가 못 읽는다.
 */
export function toImageUrls(slots: UploadSlot[]): {
  mainImageUrl: string | null;
  subImageUrls: string[];
} {
  const urls = slots.map((slot) => slot.url).filter((url): url is string => Boolean(url));
  return { mainImageUrl: urls[0] ?? null, subImageUrls: urls.slice(1) };
}
```

- [ ] **Step 6: 초록을 확인한다**

```bash
pnpm gate:mobile
```

- [ ] **Step 7: 표식으로 확인한다 (리드)**

`toImageUrls`에서 `filter(Boolean)`을 빼고 시험을 돌린다. 「아직 안 올라갔거나 실패한 것은 뺀다」가 빨개져야 한다.

- [ ] **Step 8: 리드에게 보고**

```
넣은 꾸러미 실제 버전
라이브러리 실제 함수·옵션 이름이 위 코드와 달랐던 곳 (있었다면 무엇이 어떻게)
게이트 결과 (숫자 그대로)
```

⚠️ **사진첩이 진짜 열리는지·권한을 묻는지는 실기기에서만 안다.** 시도하지 마라 — Task 13에서 사용자가 본다.

---

# Task 5: 유효성 검사

**Files:**
- Create: `mobile/lib/product-form.ts`
- Create: `mobile/lib/product-form.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type ProductFormValues = { title, description, price, petType, petDetailType, category, productStatus, addressSido, addressGugun }` (전부 `string`, `price`도 `string` — 입력칸이 글자를 준다)
  - `type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>`
  - `validateProductForm(values: ProductFormValues): ProductFormErrors`
  - `hasErrors(errors: ProductFormErrors): boolean`

**왜 순수 함수로 빼나**: 화면 없이 시험할 수 있어야 한다. 그리고 규칙이 흩어지면 등록과 수정이 서로 다르게 막는 일이 생긴다.

- [ ] **Step 1: 시험을 먼저 쓴다**

`mobile/lib/product-form.test.ts`

```ts
import { hasErrors, validateProductForm, type ProductFormValues } from './product-form';

// 문구는 웹 productPostValidationRules(src/features/signup/validationRules.ts:80-)에서
// 그대로 가져왔다. 같은 화면이 웹과 앱에서 다른 말을 하면 안 된다.
//
// ⚠️ 「상품명은 2~ 50자」의 띄어쓰기가 이상해 보여도 웹 그대로다. 고치지 마라 —
//    고치려면 웹도 같이 고쳐야 한다.

function values(overrides: Partial<ProductFormValues> = {}): ProductFormValues {
  return {
    title: '강아지 사료 10kg',
    description: '거의 새것입니다. 한 번만 열었어요.',
    price: '30000',
    petType: 'MAMMAL',
    petDetailType: 'DOG',
    category: 'FOOD',
    productStatus: 'LIKE_NEW',
    addressSido: '서울특별시',
    addressGugun: '강남구',
    ...overrides,
  };
}

describe('다 채웠을 때', () => {
  it('오류가 없다', () => {
    expect(validateProductForm(values())).toEqual({});
    expect(hasErrors({})).toBe(false);
  });
});

describe('상품명', () => {
  it('비면 막는다', () => {
    expect(validateProductForm(values({ title: '' })).title).toBe('상품명을 입력해주세요');
  });

  it('공백만 있어도 막는다', () => {
    expect(validateProductForm(values({ title: '   ' })).title).toBe('상품명을 입력해주세요');
  });

  it('한 글자면 막는다', () => {
    expect(validateProductForm(values({ title: '가' })).title).toBe(
      '상품명은 2~ 50자 이하이어야 합니다.'
    );
  });

  it('50자는 된다', () => {
    expect(validateProductForm(values({ title: '가'.repeat(50) })).title).toBeUndefined();
  });

  it('51자면 막는다', () => {
    expect(validateProductForm(values({ title: '가'.repeat(51) })).title).toBe(
      '상품명은 2~ 50자 이하이어야 합니다.'
    );
  });
});

describe('상품 설명', () => {
  // ⚠️ 서버는 선택으로 받지만 웹이 필수로 막는다. 앱은 웹을 따른다
  it('비면 막는다', () => {
    expect(validateProductForm(values({ description: '' })).description).toBe(
      '상품설명을 입력해주세요'
    );
  });

  it('1000자는 된다', () => {
    expect(validateProductForm(values({ description: '가'.repeat(1000) })).description).toBeUndefined();
  });

  it('1001자면 막는다', () => {
    expect(validateProductForm(values({ description: '가'.repeat(1001) })).description).toBe(
      '상품설명은 2 ~ 1000자 이하이어야 합니다.'
    );
  });
});

describe('가격', () => {
  it('비면 막는다', () => {
    expect(validateProductForm(values({ price: '' })).price).toBe('가격을 입력해주세요');
  });

  it('0원은 된다', () => {
    // 나눔이 있다
    expect(validateProductForm(values({ price: '0' })).price).toBeUndefined();
  });

  it('음수는 막는다', () => {
    expect(validateProductForm(values({ price: '-1' })).price).toBe('가격은 0원 이상이어야 합니다');
  });

  it('숫자가 아니면 막는다', () => {
    expect(validateProductForm(values({ price: '삼만원' })).price).toBe('가격을 입력해주세요');
  });
});

describe('고르는 값들', () => {
  it('카테고리를 안 고르면 막는다', () => {
    expect(validateProductForm(values({ category: '' })).category).toBe('카테고리를 선택해주세요');
  });

  it('상품 상태를 안 고르면 막는다', () => {
    expect(validateProductForm(values({ productStatus: '' })).productStatus).toBe(
      '상품 상태를 선택해주세요'
    );
  });

  it('펫 종류를 안 고르면 막는다', () => {
    expect(validateProductForm(values({ petType: '' })).petType).toBe('대분류를 선택해주세요(예: 포유류)');
  });

  it('세부 종류를 안 고르면 막는다', () => {
    expect(validateProductForm(values({ petDetailType: '' })).petDetailType).toBe(
      '소분류를 선택해주세요'
    );
  });

  it('지역을 안 고르면 막는다', () => {
    expect(validateProductForm(values({ addressGugun: '' })).addressGugun).toBe('지역을 선택해주세요');
  });

  it('시도만 고르고 구군을 안 고르면 막는다', () => {
    expect(validateProductForm(values({ addressSido: '서울특별시', addressGugun: '' })).addressGugun).toBe(
      '지역을 선택해주세요'
    );
  });
});

describe('hasErrors', () => {
  it('하나라도 있으면 true', () => {
    expect(hasErrors({ title: '상품명을 입력해주세요' })).toBe(true);
  });

  it('비었으면 false', () => {
    expect(hasErrors({})).toBe(false);
  });
});
```

- [ ] **Step 2: 빨간 것을 확인한다**

```bash
pnpm gate:mobile
```

- [ ] **Step 3: 만든다**

`mobile/lib/product-form.ts`

```ts
// 상품 등록·수정 폼의 검사 규칙.
//
// 화면에서 떼어 순수 함수로 둔 이유: 규칙이 흩어지면 등록과 수정이 서로 다르게 막는다.
// 서버가 전체 교체를 요구해 두 화면이 같은 값을 보내므로, 막는 규칙도 하나여야 한다.
//
// 문구는 웹 productPostValidationRules에서 그대로 가져왔다
// (src/features/signup/validationRules.ts:80-).
// ⚠️ 「2~ 50」의 이상한 띄어쓰기도 웹 그대로다. 여기만 고치면 웹과 달라진다.

export interface ProductFormValues {
  title: string;
  description: string;
  /** 입력칸이 글자를 주므로 글자로 들고 있다가 보낼 때 숫자로 바꾼다 */
  price: string;
  petType: string;
  petDetailType: string;
  category: string;
  productStatus: string;
  addressSido: string;
  addressGugun: string;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

const TITLE_RANGE = '상품명은 2~ 50자 이하이어야 합니다.';
const DESCRIPTION_RANGE = '상품설명은 2 ~ 1000자 이하이어야 합니다.';

export function validateProductForm(values: ProductFormValues): ProductFormErrors {
  const errors: ProductFormErrors = {};

  const title = values.title.trim();
  if (!title) errors.title = '상품명을 입력해주세요';
  else if (title.length < 2 || title.length > 50) errors.title = TITLE_RANGE;

  const description = values.description.trim();
  if (!description) errors.description = '상품설명을 입력해주세요';
  else if (description.length < 2 || description.length > 1000) errors.description = DESCRIPTION_RANGE;

  // 숫자가 아닌 글자는 「안 적은 것」과 같이 다룬다 — 「가격은 0원 이상」이라고 하면
  // 「삼만원」이라고 적은 사람에게 도움이 안 된다
  const price = Number(values.price);
  if (!values.price.trim() || Number.isNaN(price)) errors.price = '가격을 입력해주세요';
  else if (price < 0) errors.price = '가격은 0원 이상이어야 합니다';

  if (!values.petType) errors.petType = '대분류를 선택해주세요(예: 포유류)';
  if (!values.petDetailType) errors.petDetailType = '소분류를 선택해주세요';
  if (!values.category) errors.category = '카테고리를 선택해주세요';
  if (!values.productStatus) errors.productStatus = '상품 상태를 선택해주세요';
  // 시도만 고르고 구군을 안 고른 것도 「지역을 안 골랐다」로 다룬다
  if (!values.addressSido || !values.addressGugun) errors.addressGugun = '지역을 선택해주세요';

  return errors;
}

export function hasErrors(errors: ProductFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
```

- [ ] **Step 4: 초록을 확인한다**

```bash
pnpm gate:mobile
```

- [ ] **Step 5: 리드에게 보고**

게이트 결과와, 웹 문구를 어느 줄에서 가져왔는지 적어 보고한다.

---

# Task 6: 상품 등록·수정·삭제 API

**Files:**
- Modify: `mobile/lib/products.ts`
- Create: `mobile/lib/products.test.ts`

**Interfaces:**
- Consumes: `apiFetch`
- Produces:
  - `type ProductPayload = { petType, petDetailType, category, title, description, price, productStatus, mainImageUrl, subImageUrls, addressSido, addressGugun }`
  - `createProduct(payload: ProductPayload): Promise<number>` — 만든 상품 id
  - `updateProduct(id: number, payload: ProductPayload): Promise<void>`
  - `deleteProduct(id: number): Promise<void>`

- [ ] **Step 1: 지금 파일이 어떤 모양인지 읽는다**

```bash
sed -n '1,60p' mobile/lib/products.ts
```

기존 `fetchProducts`·`fetchProductDetail`의 오류 처리 모양을 따른다.

- [ ] **Step 2: 시험을 먼저 쓴다**

`mobile/lib/products.test.ts`

```ts
import { createProduct, deleteProduct, updateProduct, type ProductPayload } from './products';

// 서버가 전체 교체를 요구하므로 등록과 수정이 **같은 모양**을 보낸다.
// 하나라도 빠지면 400이 나거나 그 값이 비워진다.

jest.mock('./auth/api', () => ({ apiFetch: jest.fn() }));
const { apiFetch } = jest.requireMock('./auth/api') as { apiFetch: jest.Mock };

function payload(overrides: Partial<ProductPayload> = {}): ProductPayload {
  return {
    petType: 'MAMMAL',
    petDetailType: 'DOG',
    category: 'FOOD',
    title: '강아지 사료 10kg',
    description: '거의 새것입니다.',
    price: 30000,
    productStatus: 'LIKE_NEW',
    mainImageUrl: 'https://cdn/a.webp',
    subImageUrls: ['https://cdn/b.webp'],
    addressSido: '서울특별시',
    addressGugun: '강남구',
    ...overrides,
  };
}

beforeEach(() => apiFetch.mockReset());

describe('createProduct', () => {
  it('만든 상품 id를 돌려준다', async () => {
    apiFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 123 } }),
    });

    await expect(createProduct(payload())).resolves.toBe(123);
  });

  it('POST /products로 보낸다', async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 1 } }) });

    await createProduct(payload());

    expect(apiFetch).toHaveBeenCalledWith('/products', expect.objectContaining({ method: 'POST' }));
  });

  it('필드를 하나도 빠뜨리지 않고 보낸다', async () => {
    // 서버가 전체 교체를 요구한다 — 빠진 값은 비워지거나 400이 난다
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { id: 1 } }) });

    await createProduct(payload());

    const sent = JSON.parse(apiFetch.mock.calls[0][1].body as string);
    expect(Object.keys(sent).sort()).toEqual(
      [
        'addressGugun',
        'addressSido',
        'category',
        'description',
        'mainImageUrl',
        'petDetailType',
        'petType',
        'price',
        'productStatus',
        'subImageUrls',
      ].sort()
    );
  });

  it('실패하면 웹과 같은 문구로 던진다', async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });

    await expect(createProduct(payload())).rejects.toThrow('상품 등록에 실패했습니다.');
  });
});

describe('updateProduct', () => {
  it('PATCH /products/{id}로 보낸다', async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });

    await updateProduct(42, payload());

    expect(apiFetch).toHaveBeenCalledWith('/products/42', expect.objectContaining({ method: 'PATCH' }));
  });

  it('등록과 **같은** 필드를 보낸다', async () => {
    // PATCH지만 실제로는 전체 교체다 (ProductServiceImpl:235-247)
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: {} }) });

    await updateProduct(42, payload());

    const sent = JSON.parse(apiFetch.mock.calls[0][1].body as string);
    expect(sent.title).toBe('강아지 사료 10kg');
    expect(sent.addressGugun).toBe('강남구');
    expect(sent.subImageUrls).toEqual(['https://cdn/b.webp']);
  });

  it('실패하면 웹과 같은 문구로 던진다', async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });

    await expect(updateProduct(42, payload())).rejects.toThrow('상품 수정에 실패했습니다.');
  });
});

describe('deleteProduct', () => {
  it('DELETE /products/{id}로 보낸다', async () => {
    apiFetch.mockResolvedValue({ ok: true, json: async () => ({ data: null }) });

    await deleteProduct(42);

    expect(apiFetch).toHaveBeenCalledWith('/products/42', { method: 'DELETE' });
  });

  it('실패하면 웹과 같은 문구로 던진다', async () => {
    apiFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    await expect(deleteProduct(42)).rejects.toThrow('상품 삭제에 실패했습니다.');
  });
});
```

- [ ] **Step 3: 빨간 것을 확인한다**

```bash
pnpm gate:mobile
```

- [ ] **Step 4: 만든다**

`mobile/lib/products.ts` 아래에 더한다.

```ts
/**
 * 상품을 만들거나 고칠 때 보내는 것.
 *
 * ⚠️ 등록과 수정이 **같은 모양**이다. 수정은 PATCH지만 실제로는 전체 교체라
 *    (ProductServiceImpl:235-247) 안 바꾼 값도 전부 다시 보내야 한다.
 *    하나라도 빠지면 400이 나거나 그 값이 비워진다.
 */
export interface ProductPayload {
  petType: string;
  petDetailType: string;
  category: string;
  title: string;
  description: string;
  price: number;
  productStatus: string;
  mainImageUrl: string | null;
  subImageUrls: string[];
  addressSido: string;
  addressGugun: string;
}

/** @returns 만든 상품 id */
export async function createProduct(payload: ProductPayload): Promise<number> {
  const res = await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('상품 등록에 실패했습니다.');

  const body = (await res.json()) as { data?: { id?: number } };
  const id = body.data?.id;
  if (!id) throw new Error('상품 등록에 실패했습니다.');
  return id;
}

export async function updateProduct(id: number, payload: ProductPayload): Promise<void> {
  const res = await apiFetch(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('상품 수정에 실패했습니다.');
}

export async function deleteProduct(id: number): Promise<void> {
  const res = await apiFetch(`/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('상품 삭제에 실패했습니다.');
}
```

- [ ] **Step 5: 초록을 확인한다**

```bash
pnpm gate:mobile
```

- [ ] **Step 6: 리드에게 보고**

게이트 결과를 숫자 그대로 적어 보고한다.

---

# Task 7: AddressField를 폼 훅에서 떼어내기

**Files:**
- Modify: `mobile/components/signup/address-field.tsx`
- Create: `mobile/components/products/region-field.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: `RegionField({ sido, gugun, error, onChange, onOpen })` — `onChange(sido: string, gugun: string)`

**왜 필요한가**: 지금 `AddressField`는 가입 폼 훅(`useSignupForm`)을 통째로 받아 `form.setValue('addressSido', …)`를 부른다. 상품 폼은 그 훅이 없어 **그대로 못 쓴다.** 베끼면 시도·구군 고르는 코드가 두 벌이 된다.

- [ ] **Step 1: 지금 무엇에 묶여 있는지 센다**

```bash
grep -n "form\.\|values\.\|errors\." mobile/components/signup/address-field.tsx
```

쓰는 것은 넷뿐이다: `values.addressSido` · `values.addressGugun` · `errors.addressSido|addressGugun` · `form.setValue(...)`.

- [ ] **Step 2: 알맹이를 `RegionField`로 옮긴다**

`mobile/components/products/region-field.tsx` — 지금 `address-field.tsx`의 그리는 부분을 그대로 옮기되, **폼 훅 대신 값 넷을 받는다.**

```tsx
interface Props {
  sido: string;
  gugun: string;
  /** 시도·구군 중 아무거나 잘못됐을 때의 문구 */
  error?: string;
  /** 시도를 바꾸면 구군은 빈 글자로 온다 — 서울 강남구에서 부산으로 바꾸면 강남구가 남으면 안 된다 */
  onChange: (sido: string, gugun: string) => void;
  /** 목록을 열기 전에 키보드를 내린다. 안 내리면 앞 칸에서 올라온 키보드가 목록을 덮는다 */
  onOpen?: () => void;
}
```

⚠️ **화면 문구·모양은 지금 `address-field.tsx`에서 한 글자도 바꾸지 말고 옮겨라** — 「시/도를 선택해주세요」 등.

- [ ] **Step 3: `AddressField`가 `RegionField`를 쓰게 한다**

`address-field.tsx`는 껍데기만 남긴다. 가입 화면은 **눈에 보이는 변화가 없어야 한다.**

```tsx
export function AddressField({ form, onOpen }: Props) {
  const { values, errors } = form;
  return (
    <RegionField
      sido={values.addressSido}
      gugun={values.addressGugun}
      error={errors.addressSido ?? errors.addressGugun}
      onChange={(sido, gugun) => {
        form.setValue('addressSido', sido);
        form.setValue('addressGugun', gugun);
      }}
      onOpen={onOpen}
    />
  );
}
```

- [ ] **Step 4: 가입 시험이 안 깨졌는지 본다**

```bash
pnpm gate:mobile
```

기대: **기존 시험이 하나도 안 깨진다.** 깨지면 옮기다 뭔가 바뀐 것이다.

- [ ] **Step 5: 리드에게 보고**

옮기면서 **바꾼 것이 있는지**(없어야 한다), 게이트 결과를 적어 보고한다.

⚠️ 가입 화면이 그대로 도는지는 실기기에서 본다 — Task 13 목록에 넣는다.

---

# Task 8: 폼 조각 둘 (값 고르기 · 사진)

**Files:**
- Create: `mobile/components/products/picker-field.tsx`
- Create: `mobile/components/products/image-field.tsx`

**Interfaces:**
- Consumes: `Option`·`PET_TYPE_OPTIONS` 등 (Task 1) · `UploadSlot`·`pickImages`·`shrinkImage`·`uploadOne`·`makeMain`·`MAX_IMAGES` (Task 4)
- Produces:
  - `PickerField({ label, placeholder, value, options, error, disabled, disabledHint, onChange })`
  - `ImageField({ slots, onChange, error })`

- [ ] **Step 1: PickerField를 만든다**

값 하나를 하단 시트로 고르는 칸. `mobile/components/ui/bottom-sheet.tsx`를 쓴다.

```tsx
import { type Option } from '@cuddle/shared';

interface Props {
  /** 칸 위 이름표 — 「반려동물 종류」 같은 것 */
  label: string;
  /** 안 골랐을 때 회색으로 보이는 글 — 「카테고리를 선택해주세요」 */
  placeholder: string;
  value: string;
  options: readonly Option[];
  error?: string;
  /** 아직 못 고르는 상태(세부 종류는 대분류를 골라야 열린다) */
  disabled?: boolean;
  /** 못 고르는 이유 — 「먼저 대분류를 선택해주세요」 */
  disabledHint?: string;
  onChange: (code: string) => void;
}
```

⚠️ 고른 뒤 시트를 닫는다. 모양(테두리·글자 크기)은 `mobile/components/products/region-field.tsx`(Task 7)의 고르는 칸과 **같은 값**을 쓴다 — 한 화면 안에서 칸이 두 모양이면 안 된다.

- [ ] **Step 2: ImageField를 만든다**

```tsx
interface Props {
  slots: UploadSlot[];
  onChange: (slots: UploadSlot[]) => void;
  error?: string;
}
```

**그리는 모양**

```
상품 사진
첫번째 이미지가 대표 이미지가 됩니다. 드래그 또는 클릭으로 최대 5장 업로드 (각 5MB 이하)

[사진1 대표][사진2][⚠ 다시][ + 이미지 등록 ]
     ↑ 누르면 대표로            ↑ 5장 차면 사라진다
   각 칸 오른쪽 위에 ✕
```

⚠️ 웹 안내 문구에 「드래그 또는 클릭」이 들어 있는데 **앱에는 드래그가 없다.** 리드에게 물어 **앱용 문구를 정해 받아라** — 지어내지 마라.

**고른 뒤 하는 일** (한 장씩)

```tsx
const handlePick = async () => {
  const picked = await pickImages(MAX_IMAGES - slots.length);
  if (picked.length === 0) return;

  // 먼저 빈 칸을 만들어 미리보기부터 띄운다. 올라갈 때까지 기다리게 하지 않는다
  const fresh: UploadSlot[] = picked.map((image, index) => ({
    key: `${Date.now()}-${index}`,
    localUri: image.uri,
    url: null,
    failed: false,
  }));
  let current = [...slots, ...fresh];
  onChange(current);

  // ⚠️ 한 장씩 보낸다. 나란히 쏘면 요청 다섯 개가 한꺼번에 나가 느린 망에서 더 잘 끊긴다
  for (const slot of fresh) {
    try {
      const shrunk = await shrinkImage(slot.localUri);
      const url = await uploadOne(shrunk);
      current = current.map((item) => (item.key === slot.key ? { ...item, url } : item));
    } catch {
      current = current.map((item) => (item.key === slot.key ? { ...item, failed: true } : item));
    }
    onChange(current);
  }
};
```

⚠️ **`slots`를 매번 새로 읽지 말고 `current`로 이어가라.** 반복 도중 `slots`는 옛 값이라, 그걸 쓰면 앞서 올라간 것이 지워진다.

**실패한 칸을 다시** — 그 칸만 `failed: false`로 되돌리고 위와 같은 일을 한 번 한다.

**빼기** — `slots.filter((s) => s.key !== key)`

**대표로** — `onChange(makeMain(slots, key))`

- [ ] **Step 3: 게이트**

```bash
pnpm gate:mobile
```

- [ ] **Step 4: 리드에게 보고**

```
「드래그 또는 클릭」을 앱에서 뭐라고 적었는지 (리드에게 받은 문구)
게이트 결과
실기기로만 알 수 있는 것
```

⚠️ 이 두 조각은 화면이라 시험을 안 붙인다. 알맹이(대표 고르기·서버에 보낼 모양)는 Task 4에서 이미 순수 함수로 지키고 있다.

---

# Task 9: 등록 화면 + 홈의 떠 있는 단추

**Files:**
- Create: `mobile/app/products/new.tsx`
- Create: `mobile/components/products/product-form.tsx`
- Modify: `mobile/app/_layout.tsx`
- Modify: `mobile/app/(tabs)/(home)/index.tsx`

**Interfaces:**
- Consumes: `validateProductForm`·`hasErrors`·`ProductFormValues` (Task 5) · `createProduct`·`ProductPayload` (Task 6) · `PickerField`·`ImageField` (Task 8) · `RegionField` (Task 7) · `toImageUrls` (Task 4)
- Produces: `ProductForm({ initialValues, initialSlots, submitLabel, onSubmit })` · `/products/new` 경로

- [ ] **Step 1: 폼 조각을 만든다**

`mobile/components/products/product-form.tsx`

```tsx
interface Props {
  /** 수정 화면이 서버에서 받은 값을 채워 넣는다. 등록이면 빈 값 */
  initialValues: ProductFormValues;
  initialSlots: UploadSlot[];
  /** 「등록하기」 또는 「수정 완료」 */
  submitLabel: string;
  onSubmit: (payload: ProductPayload) => Promise<void>;
}
```

**항목 차례** (웹 `ProductPostForm`과 같다)

```
사진        ImageField
상품명      Field · placeholder 「예: 강아지 사료 10kg 상품」
반려동물 종류 PickerField 둘 (대분류 → 소분류)
카테고리     PickerField
판매 가격    Field · 숫자 자판 · 오른쪽에 「원」
상품 설명    여러 줄 입력칸 · placeholder 「상품의 상태, 구매 시기, 사용 빈도, 특징 등을 자세히 적어주세요」
거래 희망 지역 RegionField
```

⚠️ **대분류를 바꾸면 소분류를 비운다.** 안 그러면 「조류」인데 소분류가 「강아지」인 조합이 서버로 간다.

```tsx
const handlePetType = (code: string) => {
  setValues((prev) => ({ ...prev, petType: code, petDetailType: '' }));
};
```

⚠️ **키보드가 칸을 가리지 않게** 화면 전체를 `KeyboardAvoidingView`로 감싼다. `behavior="padding"`을 **양쪽 플랫폼 다** 준다 — `app.json`의 `edgeToEdgeEnabled: true` 때문에 안드로이드에서 창이 안 줄어든다(10바퀴에 겪었다. `mobile/AGENTS.md` 참고).

**보내기**

```tsx
const handleSubmit = async () => {
  const found = validateProductForm(values);
  setErrors(found);
  if (hasErrors(found)) return;

  const { mainImageUrl, subImageUrls } = toImageUrls(slots);
  setSubmitting(true);
  try {
    await onSubmit({
      petType: values.petType,
      petDetailType: values.petDetailType,
      category: values.category,
      title: values.title.trim(),
      description: values.description.trim(),
      price: Number(values.price),
      productStatus: values.productStatus,
      mainImageUrl,
      subImageUrls,
      addressSido: values.addressSido,
      addressGugun: values.addressGugun,
    });
  } finally {
    setSubmitting(false);
  }
};
```

- [ ] **Step 2: 등록 화면을 만든다**

`mobile/app/products/new.tsx`

```tsx
// 상품 등록. 루트 스택이라 탭바가 안 보인다 — 끝내고 나가는 화면이다
// (신고·댓글 스레드와 같은 판단).

/** 빈 폼. 고르는 값은 빈 글자로 두면 PickerField가 placeholder를 보여준다 */
const EMPTY_VALUES: ProductFormValues = {
  title: '',
  description: '',
  price: '',
  petType: '',
  petDetailType: '',
  category: '',
  productStatus: '',
  addressSido: '',
  addressGugun: '',
};

export default function NewProductScreen() {
  const router = useRouter();

  const handleSubmit = async (payload: ProductPayload) => {
    try {
      const id = await createProduct(payload);
      // 만든 상품을 바로 보여준다. 목록으로 보내면 자기 글을 또 찾아야 한다
      router.replace(`/(tabs)/(home)/products/${id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '상품 등록에 실패했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더는 화면이 직접 그린다(신고 화면과 같은 이유) */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="뒤로 가기" hitSlop={12}>
          <ChevronLeft size={26} color="#111827" />
        </Pressable>
        <Text style={styles.heading}>상품 등록</Text>
      </View>

      <ProductForm
        initialValues={EMPTY_VALUES}
        initialSlots={[]}
        submitLabel="등록하기"
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}
```

⚠️ `router.replace`를 쓴다. `push`면 뒤로가기가 방금 채운 등록 화면으로 돌아간다.

⚠️ **웹에는 등록 성공 뒤 2초 기다리는 코드가 있다**(사진 크기 변환 Lambda). **앱에는 일단 안 넣는다.** 상세에서 사진이 안 뜨면 Task 13 뒤에 넣는다.

- [ ] **Step 3: 루트 스택에 등록한다**

`mobile/app/_layout.tsx` — `report`·`comment-thread` 옆에 더한다.

```tsx
{/* 헤더는 화면이 직접 그린다. 루트에 두는 이유: 끝내고 나가는 화면이라 탭바가 보이면 안 된다 */}
<Stack.Screen name="products/new" options={{ headerShown: false }} />
<Stack.Screen name="products/[id]/edit" options={{ headerShown: false }} />
```

- [ ] **Step 4: 홈에 떠 있는 단추를 넣는다**

`mobile/app/(tabs)/(home)/index.tsx`

로그인 여부는 앱의 다른 화면과 같은 방식으로 본다(`comment-thread.tsx:76` 등).

```tsx
// 그리는 것이라 getState()가 아니라 구독해야 한다 —
// 로그인하고 돌아왔을 때 단추가 저절로 나타나야 한다
const isLoggedIn = useAuthStore((state) => state.status) === 'authed';
```

```tsx
{/* 웹 Home.tsx와 같은 자리·같은 모양. 로그인했을 때만 보인다 */}
{isLoggedIn ? (
  <Pressable
    onPress={() => router.push('/products/new')}
    accessibilityRole="button"
    accessibilityLabel="상품 등록"
    style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
  >
    <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
    <Text style={styles.fabLabel}>상품 등록</Text>
  </Pressable>
) : null}
```

```
색      #825500  (웹과 같은 값 · 탭바 활성 색과 같다)
자리    오른쪽 아래. 탭바 위로 띄운다 — insets.bottom + 72
        ⚠️ useBottomTabBarHeight()는 여기서 쓸 수 있지만(탭 화면 안이다)
           토스트가 같은 값을 쓰고 있으니 그 값을 따라가 겹치지 않게 한다
```

- [ ] **Step 5: 게이트**

```bash
pnpm gate:mobile
```

- [ ] **Step 6: 리드에게 보고**

계획서와 다르게 한 것, 게이트 결과, 실기기로만 알 수 있는 것을 적어 보고한다.

---

# Task 10: 수정 화면

**Files:**
- Create: `mobile/app/products/[id]/edit.tsx`

**Interfaces:**
- Consumes: `ProductForm` (Task 9) · `updateProduct` (Task 6) · `fetchProductDetail` (기존)
- Produces: `/products/[id]/edit` 경로

- [ ] **Step 1: 서버가 상세로 주는 필드를 확인한다**

```bash
grep -n "interface ProductDetailItem" -A25 mobile/lib/products.ts
```

⚠️ **폼이 필요한 값이 상세 응답에 다 있는지 본다.** 없는 것이 있으면 **멈추고 리드에게 보고하라** — 없는 값을 빈 글자로 채우면 저장할 때 그 값이 날아간다.

- [ ] **Step 2: 화면을 만든다**

```tsx
export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductDetail(productId),
  });

  const handleSubmit = async (payload: ProductPayload) => {
    try {
      await updateProduct(productId, payload);
      // 상세가 새 값을 받게 한다
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
      router.back();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '상품 수정에 실패했습니다.');
    }
  };

  // ⚠️ 값이 도착하기 전에는 폼을 안 그린다.
  //    initialValues는 처음 그릴 때 한 번만 읽히므로, 빈 값으로 그리면 나중에 값이 와도 안 채워진다.
  //    (웹 ProductPost.tsx:89-95도 같은 이유로 데이터가 올 때까지 폼을 안 그린다)
  if (isLoading) return <LoadingState />;
  if (isError || !product) return <ErrorState onRetry={() => refetch()} title="상품을 불러오지 못했어요." />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="뒤로 가기" hitSlop={12}>
          <ChevronLeft size={26} color="#111827" />
        </Pressable>
        <Text style={styles.heading}>상품 수정</Text>
      </View>

      <ProductForm
        initialValues={{
          title: product.title,
          description: product.description ?? '',
          price: String(product.price),
          petType: product.petType,
          petDetailType: product.petDetailType,
          category: product.category,
          productStatus: product.productStatus,
          addressSido: product.addressSido,
          addressGugun: product.addressGugun,
        }}
        // 이미 올라간 사진은 서버 주소가 곧 미리보기 주소다
        initialSlots={[product.mainImageUrl, ...(product.subImageUrls ?? [])]
          .filter((url): url is string => Boolean(url))
          .map((url, index) => ({ key: `existing-${index}`, localUri: url, url, failed: false }))}
        submitLabel="수정 완료"
        onSubmit={handleSubmit}
      />
    </SafeAreaView>
  );
}
```

⚠️ **`subImageUrls ?? []`** — 사진이 한 장뿐이면 서버가 null을 준다.

- [ ] **Step 3: 게이트**

```bash
pnpm gate:mobile
```

- [ ] **Step 4: 리드에게 보고**

**상세 응답에 없어서 채우지 못한 값이 있었는지**를 꼭 적어라. 게이트 결과도 함께.

---

# Task 11: 삭제와 ⋮ 메뉴

**Files:**
- Modify: `mobile/lib/product-menu.ts`
- Modify: `mobile/lib/product-menu.test.ts`
- Modify: `mobile/app/(tabs)/(my)/my-products.tsx`
- Modify: `mobile/app/(tabs)/(home)/products/[id].tsx`

**Interfaces:**
- Consumes: `deleteProduct` (Task 6) · `buildStatusActions` (기존)
- Produces: `buildOwnerActions(kind, current)` — 상태 변경 + 수정하기 + 삭제

- [ ] **Step 1: 시험을 먼저 더한다**

`mobile/lib/product-menu.test.ts`

```ts
describe('내 상품 ⋮ 전체', () => {
  // 상태 변경만 있던 것에 수정·삭제를 더한다.
  // 완료된 거래도 지울 수는 있어야 한다 — 잘못 올린 것을 못 지우면 갇힌다.

  it('판매중이면 상태 변경 + 수정 + 삭제', () => {
    const actions = buildOwnerActions('sales', 'SELLING');

    expect(actions.map((a) => a.label)).toEqual([
      '예약중으로 변경',
      '판매완료로 변경',
      '수정하기',
      '삭제',
    ]);
  });

  it('완료면 상태 변경은 없고 수정·삭제만', () => {
    const actions = buildOwnerActions('sales', 'COMPLETED');

    expect(actions.map((a) => a.label)).toEqual(['수정하기', '삭제']);
  });

  it('삭제는 danger다', () => {
    const actions = buildOwnerActions('sales', 'SELLING');
    const remove = actions.find((a) => a.label === '삭제');

    expect(remove?.tone).toBe('danger');
  });
});
```

- [ ] **Step 2: 빨간 것을 확인하고 만든다**

```ts
export type OwnerActionKind = 'status' | 'edit' | 'delete';

export interface OwnerAction {
  kind: OwnerActionKind;
  label: string;
  /** 상태 변경일 때만 있다 */
  next?: TradeStatus;
  tone?: 'default' | 'danger';
}

/**
 * 내 상품 ⋮ 에 보일 것 전부.
 *
 * ⚠️ 완료된 거래도 **지울 수는 있다.** 상태 변경만 막는다 —
 *    잘못 올린 것을 못 지우면 갇힌다.
 */
export function buildOwnerActions(kind: MenuKind, current: string | null): OwnerAction[] {
  return [
    ...buildStatusActions(kind, current).map((action) => ({
      kind: 'status' as const,
      label: action.label,
      next: action.next,
    })),
    { kind: 'edit', label: '수정하기' },
    { kind: 'delete', label: '삭제', tone: 'danger' },
  ];
}
```

- [ ] **Step 3: 마이 목록과 상세에 붙인다**

두 화면 다 같은 일을 한다.

```tsx
// 삭제를 누르면 시트를 먼저 닫고 확인 창을 연다 (겹쳐 뜨지 않게 — 9바퀴와 같은 순서)
<ConfirmDialog
  visible={deleteTarget !== null}
  heading="상품 삭제"
  description="정말로 이 상품을 삭제하시겠습니까?"
  notes={['삭제된 상품은 복구할 수 없습니다']}
  confirmLabel="삭제하기"
  tone="danger"
  onClose={() => setDeleteTarget(null)}
  onConfirm={async () => {
    if (!deleteTarget) return;
    try {
      await deleteProduct(deleteTarget);
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showToast('상품을 삭제했습니다');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '상품 삭제에 실패했습니다.');
    }
    // 성공이든 실패든 닫는다 — 실패해도 창이 남으면 갇힌다
    setDeleteTarget(null);
  }}
/>
```

**어디로 가나**

```
마이 목록에서 지움    목록에 그대로 머문다 (웹과 같다)
상세에서 지움        뒤로 간다 — 지운 상품 화면에 서 있을 수 없다
```

⚠️ **상세의 ⋮ 는 내 상품이면 수정·삭제, 남의 상품이면 신고·차단**이다. 지금 남의 상품용 ⋮ 가 이미 있으니 **가르기만 하면 된다.**

- [ ] **Step 4: 게이트 + 표식**

```bash
pnpm gate:mobile
```

표식: `buildOwnerActions`에서 `tone: 'danger'`를 빼고 그 시험만 빨개지는지 본다.

- [ ] **Step 5: 리드에게 보고**

---

# Task 12: 웹 상세 단추 줄

**Files:**
- Modify: `src/features/product-detail/components/ProductActions.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: 없음

**지금**: 내 상품이면 `[수정하기(넓게)] [♡]`. **삭제로 갈 길이 없다** — 마이 → 판매내역 → 찾기 → ⋮ 로 돌아가야 한다.

- [ ] **Step 1: 데스크톱 배치를 바꾼다**

```
[수정][삭제]                    [♡]
 └ 내 상품 관리 ┘                └ 다른 일
```

- 두 단추를 한 묶음으로 왼쪽, 찜을 오른쪽 끝(`justify-between`)
- **삭제는 붉은 계열로 갈라 둔다** — 나란히 있으면 잘못 누르기 쉽다. 마이 목록 확인 창이 `bg-danger-600`을 쓰니 그 계열
- **찜은 내 상품에도 그대로 둔다** — 찜 수가 목록에 보여 자기 상품 홍보로 쓰인다(의도된 동작)

- [ ] **Step 2: 모바일 폭에서는 ⋮ → 하단 시트**

앱과 같은 모양이다. #793에서 만든 `BottomSheet`를 쓰고, 마이 목록(`MyList.tsx`)이 모바일에서 시트를 여는 방식을 그대로 따른다.

- [ ] **Step 3: 삭제 확인 창을 잇는다**

이미 있는 `DeleteConfirmModal`을 쓴다. **새로 만들지 마라.**

지운 뒤: 상세에 머물 수 없으니 **상품 목록으로 보낸다.**

- [ ] **Step 4: 웹 게이트**

```bash
pnpm gate
```

- [ ] **Step 5: 눈으로 확인 (리드)**

```
□ 데스크톱: 내 상품에 [수정][삭제]  [♡] · 삭제가 붉게 갈라져 있다
□ 데스크톱: 남의 상품에 [채팅하기] [♡] (예전 그대로)
□ 모바일 폭: 내 상품에 ⋮ → 시트(수정하기·삭제)
□ 삭제 → 확인 창 → 목록으로 이동
```

---

# Task 13: 실기기 확인 (사용자)

**Files:** 없음 (확인만)

- [ ] **Step 1: 웹부터**

```bash
pnpm dev
```

폭을 바꿔 가며 Task 2·12의 확인 목록을 본다.

- [ ] **Step 2: 앱을 띄운다**

```bash
cd mobile && pnpm expo start
# 폰이 다른 와이파이면
cd mobile && pnpm expo start --tunnel
```

시험 계정: `devel.jjub+gate798@gmail.com` / `Abcdef1!xy`

- [ ] **Step 3: 스펙 §9의 완료 기준을 하나씩 본다**

**게이트가 절대 못 잡는 것부터** 본다.

```
□ 사진첩이 열리는가 · 권한을 물어보는가 · 거절하면 어떻게 되는가
□ 아이폰 HEIC 사진이 올라가는가 (webp로 바뀌어 통과해야 한다)
□ 줄인 사진이 알아볼 만한가 (800px가 충분한가)
□ 올리는 동안 화면이 멈추지 않는가 · 올라간 것부터 보이는가
□ 전파를 끊고 올려 보면 그 한 장만 실패하는가
□ 키보드가 입력칸을 가리지 않는가
□ 등록 뒤 상세에서 사진이 **바로** 뜨는가   ← 안 뜨면 웹처럼 2초 기다림이 필요하다
□ 가입 화면의 거주지 고르기가 그대로 도는가  ← Task 7에서 건드렸다
```

- [ ] **Step 4: 게이트 전부**

```bash
pnpm gate:all
```

- [ ] **Step 5: 스펙에 실기기 결과를 적는다**

`docs/superpowers/specs/2026-08-03-app-product-post-design.md`에 §11을 더해 드러난 것을 남긴다. 없으면 「확인 완료」만 적는다.

- [ ] **Step 6: PR**

`/commit-push`로 만든다. **base는 `develop`이다.** 본문에 `- Close #826`을 넣는다(글머리 기호와 「Close」 표기가 이 저장소 관례다).

---

## 나중에 할 것 (이슈로 남긴다)

```
사진 쓸어내기        서버가 주기적으로 — 어느 상품·글에서도 안 쓰는 사진을 N일 뒤 삭제
                    ⚠️ 프론트가 「지워 줘」를 부르는 방식은 앱이 죽으면 못 불러서
                       만들어 놓고도 여전히 남는다. NotificationCleanupScheduler와 같은 모양으로
판매 요청 등록        price → desiredPrice · productStatus 없음. 나머지는 같다
커뮤니티 글쓰기       다음 바퀴. 이번에 뚫은 사진 길을 그대로 쓴다
임시저장             Task 13에서 폼을 잃는 일을 겪으면 그때
서버 설정 어긋남      ImageUploadService는 25MB, application-prod.properties는 5MB
```
