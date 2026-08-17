# 앱 커뮤니티 목록을 홈과 같은 얼개로 — 구현 계획

> **에이전트에게:** 이 계획은 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans` 로 **한 과제씩** 진행한다. 단계는 체크상자(`- [ ]`)로 표시돼 있다.

**목표:** 앱 커뮤니티 목록의 헤더·탭·검색·정렬을 홈 화면과 같은 얼개로 맞춘다.

**얼개:** 홈이 쓰는 「밑줄이 미끄러지는 탭」을 공용 조각으로 뽑아 두 화면이 나눠 쓰게 한다. 커뮤니티의 검색은 목록 위 칸에서 **헤더 돋보기 → 검색 화면**으로 옮기고, 검색어는 화면 주소(params)로 들고 다녀 **목록 화면 그대로** 결과를 그린다. 정렬 줄은 모양을 그대로 두고 자리만 목록 밖으로 옮긴다.

**기술:** Expo SDK 54 · React Native 0.81.5 · React 19.1.0 · expo-router 6 · @tanstack/react-query 5 · Reanimated · Jest(jest-expo) + @testing-library/react-native

**설계 문서:** `docs/superpowers/specs/2026-08-17-app-community-list-layout-design.md`

## 전체 제약

- **게이트는 저장소 루트에서** `pnpm gate:mobile` (= `tsc --noEmit && expo lint && jest`). `cd mobile` 뒤에 루트 명령을 치면 실패한다.
- **`npx prettier --write` 금지.** 저장된 코드가 프리티어 설정과 조금 달라 관계없는 줄까지 다시 접힌다. 들여쓰기는 손으로 맞춘다.
- **lint 경고가 늘면 안 된다.** 지금 앱은 경고 0이다.
- **화면 시험은 `mobile/__tests__/` 에 둔다.** `app/` 안에 시험 파일을 두면 expo-router 가 그것도 화면으로 보고 앱 번들에 끼워 넣어 **실기기가 아예 안 뜬다**. 타입체크도 린트도 안 잡아준다.
- 시험용 `QueryClient` 에는 **`gcTime: Infinity`**. 안 주면 시험은 다 초록인데 jest 가 안 끝난다.
- `@testing-library/react-native` 14의 `render`·`rerender`·`fireEvent` 는 **셋 다 `await`** 한다. 안 하면 오류 없이 옛 값을 준다.
- **문구를 새로 짓지 않는다.** 웹에 같은 화면이 있으면 그 글자를 그대로 가져온다.
- **주석은 한국어로, 「왜」를 적는다.** 주변 주석 톤을 보고 맞춘다.
- **브랜치는 리드가 만든다. 판(에이전트)은 커밋·푸시·PR 을 하지 않는다.**
- jsdom(jest)에는 **배치·스크롤·IntersectionObserver 가 없다.** 「몇 픽셀에 그려졌나」는 못 잰다 — 그건 실기기 몫이다.

---

## 파일 지도

```
새로 만든다
  mobile/components/ui/underline-tabs.tsx          밑줄이 미끄러지는 탭 (공용)
  mobile/components/ui/underline-tabs.test.tsx     그 조각의 시험
  mobile/app/community-search.tsx                  커뮤니티 검색 입력 화면

고친다
  mobile/components/products/product-filter-row.tsx   뽑아낸 조각을 쓰게 (모양은 그대로)
  mobile/app/(tabs)/(community)/index.tsx             헤더·탭·정렬 자리·검색어 받기
  mobile/__tests__/community-list-screen.test.tsx     칩 → 탭, 검색어 관련 시험
  mobile/__tests__/community-list-write-button.test.tsx  탭 표식이 바뀌면 같이

안 지우지만 표시만 남긴다
  mobile/components/community/post-search-input.tsx   「지금은 아무도 안 쓴다」
```

---

## 과제 1: 밑줄 탭을 공용 조각으로 뽑는다

지금 그 탭은 `product-filter-row.tsx` 안에 **갇혀 있다**(`PetTypeTabRow`, 내보내지 않는다). 커뮤니티가 쓰려면 밖으로 꺼내야 한다.

⚠️ **이 과제가 이번 일에서 가장 위험하다.** 홈은 앱에서 가장 중요한 화면인데, 조각을 옮기면서 조용히 달라질 수 있다. **상품 쪽 기존 시험이 하나도 안 고쳐지고 그대로 통과하는 것**이 이 과제의 합격 기준이다.

**파일**
- 만든다: `mobile/components/ui/underline-tabs.tsx`
- 만든다: `mobile/components/ui/underline-tabs.test.tsx`
- 고친다: `mobile/components/products/product-filter-row.tsx`

**주고받는 것**
- 내놓는 것: `UnderlineTabs` 조각과 `UnderlineTabOption` 타입.
  ```ts
  export interface UnderlineTabOption { code: string; label: string }
  export function UnderlineTabs(props: {
    selected: string | null
    options: readonly UnderlineTabOption[]
    onChange: (next: string | null) => void
    allLabel?: string
    testIDPrefix: string
  }): JSX.Element
  ```
- 쓰는 것: 없음(첫 과제).

### 표식(testID) 규칙 — 여기가 핵심이다

기존 상품 시험이 쓰는 표식을 **글자 하나 안 바꾸고** 유지해야 한다. 그래서 앞머리를 값으로 받는다.

```
줄      `${testIDPrefix}-row`     상품 → pet-type-tab-row
탭      `${testIDPrefix}-${code}` 상품 → pet-type-tab-MAMMAL · pet-type-tab-ALL
바      `${testIDPrefix}-bar`     상품 → pet-type-tab-bar
```

상품은 `testIDPrefix="pet-type-tab"` 을 넘긴다. 커뮤니티는 `"board-tab"` 을 넘긴다.

- [ ] **1단계: 지금 상품 시험이 초록인지 먼저 확인한다 (기준선)**

먼저 재 두지 않으면, 뒤에서 빨개졌을 때 그게 내가 깬 것인지 원래 그런 것인지 못 가린다.

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile 2>&1 | tail -5
```
기대: `Tests: 701 passed` · `EXIT=0`

- [ ] **2단계: 공용 조각의 시험을 먼저 쓴다 (실패해야 한다)**

`mobile/components/ui/underline-tabs.test.tsx` 를 만든다.

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';

import { UnderlineTabs } from '@/components/ui/underline-tabs';

// 홈(상품)에서 뽑아낸 조각이라 **전과 똑같이 도는지**가 핵심이다.
// 여기서는 「전체 탭이 없는 쓰임」(커뮤니티)까지 함께 지킨다.

const 게시판 = [
  { code: 'QUESTION', label: '질문 있어요' },
  { code: 'INFO', label: '정보 공유' },
] as const;

it('표식 앞머리를 받아 줄·탭·바에 붙인다', async () => {
  // ⚠️ 상품 쪽 시험이 pet-type-tab-* 을 그대로 쓴다. 앞머리 규칙이 깨지면 그쪽이 다 빨개진다.
  await render(
    <UnderlineTabs
      selected="QUESTION"
      options={게시판}
      onChange={() => {}}
      testIDPrefix="board-tab"
    />
  );

  expect(screen.getByTestId('board-tab-row')).toBeTruthy();
  expect(screen.getByTestId('board-tab-QUESTION')).toBeTruthy();
  expect(screen.getByTestId('board-tab-bar')).toBeTruthy();
});

it('allLabel 을 주면 맨 앞에 「전체」 탭이 생긴다 (상품)', async () => {
  await render(
    <UnderlineTabs
      selected={null}
      options={게시판}
      onChange={() => {}}
      allLabel="전체"
      testIDPrefix="board-tab"
    />
  );

  expect(screen.getByTestId('board-tab-ALL')).toBeTruthy();
});

it('allLabel 을 안 주면 「전체」 탭이 없다 (커뮤니티)', async () => {
  // 커뮤니티 게시판에는 「전체」가 없다 — 질문이거나 정보 공유거나 둘 중 하나다.
  await render(
    <UnderlineTabs
      selected="QUESTION"
      options={게시판}
      onChange={() => {}}
      testIDPrefix="board-tab"
    />
  );

  expect(screen.queryByTestId('board-tab-ALL')).toBeNull();
});

it('탭을 누르면 그 값을 알린다', async () => {
  const 바뀜 = jest.fn();
  await render(
    <UnderlineTabs
      selected="QUESTION"
      options={게시판}
      onChange={바뀜}
      testIDPrefix="board-tab"
    />
  );

  await fireEvent.press(screen.getByTestId('board-tab-INFO'));

  expect(바뀜).toHaveBeenCalledWith('INFO');
});

it('「전체」를 누르면 null 을 알린다', async () => {
  // 「전체」는 조건 없음이라 null 로 알린다 — 서버에 'ALL' 을 보내면 그런 종류를 찾아 0건이 된다.
  const 바뀜 = jest.fn();
  await render(
    <UnderlineTabs
      selected="INFO"
      options={게시판}
      onChange={바뀜}
      allLabel="전체"
      testIDPrefix="board-tab"
    />
  );

  await fireEvent.press(screen.getByTestId('board-tab-ALL'));

  expect(바뀜).toHaveBeenCalledWith(null);
});

it('고른 탭에 골랐다는 표시가 붙는다', async () => {
  // 읽어 주는 기능이 이걸 본다. 바(밑줄)는 그림이라 소리로는 안 읽힌다.
  await render(
    <UnderlineTabs
      selected="INFO"
      options={게시판}
      onChange={() => {}}
      testIDPrefix="board-tab"
    />
  );

  expect(screen.getByTestId('board-tab-INFO').props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(screen.getByTestId('board-tab-QUESTION').props.accessibilityState).toMatchObject({
    selected: false,
  });
});
```

- [ ] **3단계: 시험이 실패하는지 확인한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest components/ui/underline-tabs.test.tsx 2>&1 | tail -12
```
기대: 실패. `Cannot find module '@/components/ui/underline-tabs'`

- [ ] **4단계: 조각을 옮긴다**

`mobile/components/ui/underline-tabs.tsx` 를 만들고, `product-filter-row.tsx` 에서 아래를 **그대로 옮긴다**(로직을 새로 짜지 마라 — 옮기는 것이다):

```
PetTypeTabRow 함수 전체        · Tab 함수 전체 · TabLayout 타입
ALL_OPTION_KEY 상수           · TAB_SLIDE_MS 상수
styles 중 tabScroll · tabRowPadding · tabRow · tab · tabBar ·
        tabLabel · tabLabelActive · tabLabelIdle · pressed
```

옮기면서 **이것만** 바꾼다:

1. 이름을 `PetTypeTabRow` → `UnderlineTabs` 로.
2. props 에 `allLabel?: string` 과 `testIDPrefix: string` 을 더한다.
3. 박아 두었던 표식을 앞머리로 조립한다.
   ```tsx
   testID={`${testIDPrefix}-row`}          // ScrollView
   testID={`${testIDPrefix}-bar`}          // Animated.View (바)
   testID={`${testIDPrefix}-${tabKey}`}    // Tab 안
   ```
4. 「전체」 탭을 `allLabel` 이 있을 때만 그린다.
   ```tsx
   {allLabel ? (
     <Tab
       tabKey={ALL_OPTION_KEY}
       label={allLabel}
       active={selected === null}
       onPress={() => onChange(null)}
       onLayout={자리를잰다(ALL_OPTION_KEY)}
       testIDPrefix={testIDPrefix}
     />
   ) : null}
   ```
5. `Option` 타입을 `@cuddle/shared` 에서 가져오지 말고 **이 파일이 자기 타입을 갖는다**:
   ```tsx
   export interface UnderlineTabOption {
     code: string
     label: string
   }
   ```
   ⚠️ 공용 조각이 상품 전용 타입에 매이면 커뮤니티가 못 쓴다. `PET_TYPE_OPTIONS` 는 `{code,label}` 모양이라 그대로 넘어간다.

**파일 맨 위 주석에 이걸 적는다** (지금 `product-filter-row.tsx` 에 있는 경고를 함께 옮긴다):

```tsx
// 밑줄이 미끄러지는 탭. **홈(상품 대분류)과 커뮤니티(게시판)가 나눠 쓴다.**
//
// ⚠️ **바는 탭마다 하나씩이 아니라 줄 전체에 하나뿐이다.** 탭마다 자기 borderBottom 을
//    켜고 끄면 즉시 갈아 끼워져 「툭툭 끊긴다」로 느껴진다(2026-08-06 실기기).
//    그래서 탭의 자리(x·너비)를 재 두고 그 자리로 바를 옮긴다.
//
// ⚠️ **표식(testID) 앞머리를 값으로 받는다.** 상품 쪽 시험이 pet-type-tab-* 를 그대로 쓰기
//    때문이다 — 여기서 이름을 바꾸면 그쪽이 한꺼번에 빨개진다.
//
// ⚠️ **「전체」 탭은 allLabel 을 줄 때만 생긴다.** 상품에는 있고 커뮤니티에는 없다.
//    커뮤니티 게시판은 질문이거나 정보 공유거나 둘 중 하나라 「조건 없음」이 없다.
```

- [ ] **5단계: 공용 조각 시험이 통과하는지 확인한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest components/ui/underline-tabs.test.tsx 2>&1 | tail -8
```
기대: 6개 통과

- [ ] **6단계: 상품 쪽이 그 조각을 쓰게 바꾼다**

`product-filter-row.tsx` 의 `ProductPetTypeTabs` 안에서:

```tsx
<UnderlineTabs
  selected={petType}
  options={PET_TYPE_OPTIONS}
  onChange={handleChangePetType}
  allLabel="전체"
  testIDPrefix="pet-type-tab"
/>
```

옮겨 간 코드(`PetTypeTabRow`·`Tab`·`TabLayout`·`ALL_OPTION_KEY`·`TAB_SLIDE_MS`와 위에 적은 styles)를 이 파일에서 **지운다**.

⚠️ `ALL_OPTION_KEY` 는 이 파일의 **알약 줄**(`pillKey={ALL_OPTION_KEY}`, 405줄 근처)에서도 쓴다. 알약 줄은 안 옮기므로 **상수는 이 파일에도 남겨 둔다.** 지우면 타입체크가 깨진다.

- [ ] **7단계: 상품 쪽 시험이 하나도 안 고치고 통과하는지 확인한다 ← 이 과제의 합격선**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest components/products/ 2>&1 | tail -8
```
기대: 전부 통과. **시험 파일을 고쳐서 통과시키면 안 된다** — 고쳐야 한다면 모양이 달라진 것이므로 6단계를 다시 본다.

- [ ] **8단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile 2>&1 | tail -5
```
기대: `EXIT=0` · 시험 701 + 6 = **707개**

- [ ] **9단계: 리드에게 보고**

무엇을 옮겼는지, 상품 시험을 **하나도 안 고쳤는지**, 게이트 마지막 줄. (커밋은 리드가 한다.)

---

## 과제 2: 커뮤니티 게시판을 밑줄 탭으로

**파일**
- 고친다: `mobile/app/(tabs)/(community)/index.tsx`
- 고친다: `mobile/__tests__/community-list-screen.test.tsx`
- 고친다: `mobile/__tests__/community-list-write-button.test.tsx`

**주고받는 것**
- 쓰는 것: 과제 1의 `UnderlineTabs` · `UnderlineTabOption`
- 내놓는 것: 커뮤니티 탭 표식 `board-tab-QUESTION` · `board-tab-INFO`

- [ ] **1단계: 지금 시험이 무엇을 눌러 보는지 읽는다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && grep -n "정보 공유\|질문\|getByRole" __tests__/community-list-screen.test.tsx __tests__/community-list-write-button.test.tsx
```

지금은 `screen.getByRole('button', { name: '정보 공유' })` 로 칩을 찾는다. 탭도 `accessibilityRole="button"` 에 같은 글자라 **이 방식은 그대로 통한다.** 표식으로 찾는 곳만 고치면 된다.

- [ ] **2단계: 시험을 먼저 고친다 (실패해야 한다)**

`__tests__/community-list-screen.test.tsx` 에 아래 시험을 더한다.

```tsx
it('게시판을 밑줄 탭으로 그린다', async () => {
  // ⚠️ 알약이 아니라 탭이다. 홈의 대분류 줄과 같은 조각을 쓴다 —
  //    같은 자리에 있는 같은 성격의 줄이 화면마다 다른 모양이면 안 된다(설계 §②).
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  expect(screen.getByTestId('board-tab-row')).toBeTruthy();
  expect(screen.getByTestId('board-tab-QUESTION')).toBeTruthy();
  expect(screen.getByTestId('board-tab-INFO')).toBeTruthy();
  // 「전체」는 없다 — 질문이거나 정보 공유거나 둘 중 하나다
  expect(screen.queryByTestId('board-tab-ALL')).toBeNull();
});

it('탭을 누르면 그 게시판으로 다시 부른다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  await fireEvent.press(screen.getByTestId('board-tab-INFO'));

  await waitFor(() => expect(마지막조건()).toMatchObject({ boardType: 'INFO' }));
});
```

- [ ] **3단계: 실패하는지 확인한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest __tests__/community-list-screen.test.tsx 2>&1 | tail -12
```
기대: 새 시험 둘이 실패. `Unable to find an element with testID: board-tab-row`

- [ ] **4단계: 화면을 고친다**

`app/(tabs)/(community)/index.tsx`:

```tsx
import { UnderlineTabs, type UnderlineTabOption } from '@/components/ui/underline-tabs';
```

`BOARD_CHIPS` 를 탭 값으로 바꾼다. **글자는 그대로 둔다** — 웹에서 가져온 것이다.

```tsx
/**
 * 게시판 둘. 웹 커뮤니티의 탭 글자를 그대로 쓴다.
 *
 * ⚠️ **「전체」가 없다.** 질문이거나 정보 공유거나 둘 중 하나다 — 그래서 UnderlineTabs 에
 *    allLabel 을 안 준다. 홈(상품 대분류)에는 「전체」가 있다.
 */
const BOARD_TABS: readonly UnderlineTabOption[] = [
  { code: 'QUESTION', label: '질문 있어요' },
  { code: 'INFO', label: '정보 공유' },
];
```

그리는 자리에서 `StatusFilterChips` 를 갈아 끼운다:

```tsx
<UnderlineTabs
  selected={boardType}
  options={BOARD_TABS}
  // 「전체」가 없어 null 이 올 일이 없다. 타입을 좁히는 자리다.
  onChange={(next) => {
    if (next) changeBoardType(next as BoardType);
  }}
  testIDPrefix="board-tab"
/>
```

`StatusFilterChips` · `FilterChip` import 를 지운다. (그 조각 자체는 마이·판매자 프로필이 계속 쓰므로 **파일은 그대로 둔다.**)

- [ ] **5단계: 통과하는지 확인한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest __tests__/community-list 2>&1 | tail -8
```
기대: 두 파일 전부 통과. 빨개진 옛 시험이 있으면 **표식만** 고친다(동작 기대는 바꾸지 마라).

- [ ] **6단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile 2>&1 | tail -5
```
기대: `EXIT=0` · 709개

- [ ] **7단계: 리드에게 보고**

---

## 과제 3: 정렬 줄을 목록 밖으로

**파일**
- 고친다: `mobile/app/(tabs)/(community)/index.tsx`
- 고친다: `mobile/__tests__/community-list-screen.test.tsx`

⚠️ **붙는 줄(sticky)로 만들지 마라.** 정렬 줄은 목록 안에서 맨 처음이라 붙여 두는 것과 목록 밖에 두는 것이 **눈에는 똑같다.** 그런데 붙는 줄로 만들면 #935 에서 잡은 고장(붙은 줄 안 누름판의 `onPress` 가 버려지는 리액트 네이티브 회귀)을 복제하게 된다.

- [ ] **1단계: 시험을 먼저 쓴다 (실패해야 한다)**

`__tests__/community-list-screen.test.tsx` 에 더한다.

```tsx
it('목록이 비어도 정렬 줄이 남는다', async () => {
  // ⚠️ 예전에는 정렬 줄이 목록의 헤더라, 목록이 비면 **통째로 사라졌다** —
  //    조건을 되돌릴 길이 화면에서 없어졌다. 목록 밖으로 옮겨 그 문제도 같이 없앤다(설계 §④).
  fetchPosts.mockResolvedValue(한페이지([]));

  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());

  expect(screen.getByTestId('community-sort-latest')).toBeTruthy();
});

it('오류일 때도 정렬 줄이 남는다', async () => {
  fetchPosts.mockRejectedValue(new Error('그물이 끊겼어요'));

  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText('다시 시도')).toBeTruthy());
  expect(screen.getByTestId('community-sort-latest')).toBeTruthy();
});
```

- [ ] **2단계: 실패하는지 확인한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest __tests__/community-list-screen.test.tsx 2>&1 | tail -12
```
기대: 새 시험 둘이 실패(목록이 비면 정렬 줄이 안 그려진다).

- [ ] **3단계: 자리를 옮긴다**

`FlatList` 의 `ListHeaderComponent={<CommunitySortRow … />}` 줄을 **지우고**, 목록 밖 형제로 옮긴다.

```tsx
      <AppHeader left="커뮤니티" />
      {/* 여기 둘은 목록 **밖**이라 늘 보인다 — 빈 화면·오류일 때도 조건을 되돌릴 수 있다 */}
      <UnderlineTabs … />
      {/* ⚠️ 정렬 줄도 목록 밖이다. 예전에는 목록 헤더라 스크롤하면 사라지고 목록이 비면
          아예 안 보였다. 붙는 줄(sticky)로 만들지 않는 이유는 설계 §④에 있다 —
          정렬 줄이 목록의 맨 처음이라 **눈에는 똑같은데** #935 함정만 새로 밟게 된다. */}
      <CommunitySortRow sortBy={sortBy} onChange={setSortBy} />
      {renderList()}
```

`renderList` 안의 `ListHeaderComponent` 줄과 그 위 주석 두 줄(「정렬 줄은 목록과 함께 스크롤되어 사라진다」)을 지운다 — **낡은 설명이 남으면 다음 사람이 헷갈린다.**

- [ ] **4단계: 통과하는지 확인한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest __tests__/community-list-screen.test.tsx 2>&1 | tail -8
```

- [ ] **5단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile 2>&1 | tail -5
```
기대: `EXIT=0` · 711개

- [ ] **6단계: 리드에게 보고**

---

## 과제 4: 커뮤니티 검색 입력 화면

**파일**
- 만든다: `mobile/app/community-search.tsx`

**주고받는 것**
- 쓰는 것: `SearchBarHeader`(`@/components/products/search-bar-header`)
- 내놓는 것: 주소 `/community-search`. 확인 키를 누르면 커뮤니티 목록으로 **되돌아가며** `keyword` 를 넘긴다.

⚠️ 이 과제 뒤에도 **이 화면으로 가는 길은 아직 없다**(돋보기는 과제 5에서 단다). 그래서 이 과제만으로는 화면에 아무 변화가 없다 — 정상이다.

- [ ] **1단계: 상품 검색 화면을 열어 그대로 본뜬다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && cat app/search.tsx
```

⚠️ **짐작으로 짓지 마라.** 두 검색 화면이 다르게 생기면 앱이 어긋나 보인다.

- [ ] **2단계: 화면을 만든다**

`mobile/app/community-search.tsx`:

```tsx
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchBarHeader } from '@/components/products/search-bar-header';
import { colors } from '@/constants/colors';

// 커뮤니티 검색 화면. 커뮤니티 목록 헤더의 돋보기를 누르면 여기로 온다.
//
// 상품 검색 화면(app/search.tsx)과 **같은 검색 줄 조각**을 쓴다 — 두 화면이 다르게 생기면
// 오갈 때 글자가 들썩인다.
//
// ⚠️ **상품과 다른 점 하나** — 상품은 결과를 **별도 화면**(/search-result)에 그리는데,
//    커뮤니티는 **목록 화면으로 돌아가서** 검색어만 걸린다. 결과에서도 게시판 탭과 하단
//    탭바가 계속 보여야 하기 때문이다(설계 §③). 그래서 여기서 결과 화면으로 가지 않는다.

export default function CommunitySearchScreen() {
  const router = useRouter();

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // 딥링크 등으로 뒤로 갈 곳이 없을 때의 대비. '/'는 여러 탭을 가리켜 어디로 갈지
      // 정해지지 않으므로 커뮤니티를 콕 집는다(app/search.tsx 와 같은 이유).
      router.replace('/(tabs)/(community)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <SearchBarHeader
        autoFocus
        onBack={close}
        // ⚠️ push 가 아니라 **replace** 다. 결과(목록)에서 뒤로 가면 이 빈 검색 화면이
        //    아니라 원래 보던 자리로 가야 한다. 검색어를 고치고 싶으면 목록 헤더의
        //    검색 줄에서 바로 고친다(과제 5).
        onSubmit={(keyword) =>
          router.replace({ pathname: '/(tabs)/(community)', params: { keyword } })
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
});
```

- [ ] **3단계: 타입체크·린트가 통과하는지 확인한다**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile 2>&1 | tail -5
```
기대: `EXIT=0` · 시험 개수 그대로(711)

⚠️ 화면 시험은 여기서 안 쓴다. 이 화면은 껍데기뿐이고, **정말 확인해야 할 것(주소가 제대로 이어지는가)은 과제 5의 시험과 실기기에서 잡힌다.**

- [ ] **4단계: 리드에게 보고**

---

## 과제 5: 헤더 돋보기 + 검색어를 목록에 걸기

**파일**
- 고친다: `mobile/app/(tabs)/(community)/index.tsx`
- 고친다: `mobile/__tests__/community-list-screen.test.tsx`
- 고친다: `mobile/components/community/post-search-input.tsx` (**주석 한 덩어리만**)

**주고받는 것**
- 쓰는 것: 과제 4의 `/community-search`, `SearchBarHeader`
- 내놓는 것: 커뮤니티 목록이 `keyword` 를 **화면 주소(params)** 로 받는다.

### 무엇이 어떻게 달라지나

```
평소            AppHeader 「커뮤니티」 + [🔍]      돋보기 → /community-search
검색 중         SearchBarHeader [사료  ✕]         뒤로 → 검색 풀림
그 아래         탭 · 정렬 · 목록 · 탭바           둘 다 그대로
```

검색어를 `useState` 가 아니라 **주소(params)** 로 든다. 검색 화면이 `router.replace(…params)` 로 돌려주는 값을 그대로 받으려면 그래야 한다.

- [ ] **1단계: 시험을 먼저 쓴다 (실패해야 한다)**

`__tests__/community-list-screen.test.tsx` 맨 위 `expo-router` 흉내에 주소 값을 더한다. **이미 있는 흉내를 고치는 것**이지 새로 만드는 게 아니다.

```tsx
/** 화면 주소에 실린 값. 시험이 여기에 검색어를 넣어 「검색 중」 상태를 만든다. */
const mock주소값: { keyword?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), setParams: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => mock주소값,
  useFocusEffect: (callback: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect } = require('react') as typeof import('react');
    useEffect(() => {
      mock초점.돌아온다 = callback;
      callback();
    }, [callback]);
  },
}));

beforeEach(() => {
  delete mock주소값.keyword;
});
```

그리고 시험 셋을 더한다.

```tsx
it('평소에는 제목과 돋보기가 있는 헤더다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  expect(screen.getByText('커뮤니티')).toBeTruthy();
  expect(screen.getByLabelText('검색')).toBeTruthy();
});

it('주소에 검색어가 있으면 그 조건으로 부른다', async () => {
  // 검색 화면이 목록으로 돌려보내며 주소에 검색어를 싣는다(과제 4).
  mock주소값.keyword = '사료';

  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(마지막조건()).toMatchObject({ keyword: '사료' }));
});

it('검색 중에는 헤더가 검색 줄로 바뀌고, 탭과 정렬 줄은 그대로다', async () => {
  // ⚠️ 여기가 상품과 다른 점이다 — 상품은 결과를 별도 화면에 그려 탭바가 사라진다.
  //    커뮤니티는 목록 화면 그대로라 게시판 탭도 정렬 줄도 계속 보여야 한다(설계 §③).
  mock주소값.keyword = '사료';

  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());

  expect(screen.queryByText('커뮤니티')).toBeNull();
  expect(screen.getByTestId('board-tab-row')).toBeTruthy();
  expect(screen.getByTestId('community-sort-latest')).toBeTruthy();
});
```

- [ ] **2단계: 실패하는지 확인한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest __tests__/community-list-screen.test.tsx 2>&1 | tail -14
```
기대: 새 시험 셋 실패.

- [ ] **3단계: 화면을 고친다**

`app/(tabs)/(community)/index.tsx`:

```tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';

import { SearchBarHeader } from '@/components/products/search-bar-header';
```

검색어를 주소에서 읽는다. `const [keyword, setKeyword] = useState('')` 를 **지우고**:

```tsx
  // ⚠️ **검색어는 화면 상태가 아니라 주소(params)로 든다.** 검색 화면이 목록으로 돌려보낼 때
  //    주소에 실어 주기 때문이다(app/community-search.tsx). 상태로 두면 그 값을 못 받는다.
  const { keyword = '' } = useLocalSearchParams<{ keyword?: string }>();
```

탭을 바꾸면 검색어를 푼다 — 지금 `changeBoardType` 이 `setKeyword('')` 하던 자리를 주소 갱신으로 바꾼다:

```tsx
  const changeBoardType = (next: BoardType) => {
    setBoardType(next);
    // 탭을 바꾸면 검색어와 정렬을 푼다. 웹도 탭 전환에 다른 파라미터를 안 이어붙인다.
    router.setParams({ keyword: '' });
    setSortBy('latest');
  };
```

헤더를 갈래로 나눈다:

```tsx
      {/* ⚠️ 검색 중에는 헤더만 검색 줄로 바뀐다. **탭·정렬·하단 탭바는 그대로 남는다** —
          상품은 결과를 별도 화면에 그려 탭바가 사라지는데, 커뮤니티는 「보다가 찾는」
          흐름이라 탭 안에 머무는 게 맞다(설계 §③). */}
      {keyword ? (
        <SearchBarHeader
          initialKeyword={keyword}
          // 뒤로 = 검색 풀기. 화면을 닫는 게 아니라 조건만 없앤다.
          onBack={() => router.setParams({ keyword: '' })}
          // 화면을 새로 밀지 않고 이 화면의 검색어만 바꾼다(상품 결과 화면과 같은 방식).
          onSubmit={(next) => router.setParams({ keyword: next })}
        />
      ) : (
        <AppHeader
          left="커뮤니티"
          right={
            <Pressable
              onPress={() => router.push('/community-search')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="검색"
              style={({ pressed }) => (pressed ? styles.iconPressed : undefined)}
            >
              <Search size={24} color={colors.onSurface} />
            </Pressable>
          }
        />
      )}
```

`PostSearchInput` 을 그리던 줄과 그 import 를 지운다.

⚠️ `styles.iconPressed` 가 이 파일에 없으면 홈 화면(`app/(tabs)/(home)/index.tsx`)의 같은 이름 스타일을 그대로 가져와 만든다: `{ opacity: 0.5 }`.

- [ ] **4단계: 안 쓰게 된 조각에 표시를 남긴다**

`mobile/components/community/post-search-input.tsx` 맨 위에 덧붙인다. **파일은 지우지 않는다** — 안 쓰게 된 파일은 모아서 나중에 한 번에 치우기로 했다.

```tsx
// ⚠️ **지금은 아무도 안 쓴다.** 커뮤니티 검색이 목록 위 칸에서 헤더 돋보기 → 검색 화면
//    (app/community-search.tsx)으로 옮겨 가면서 쓰는 곳이 없어졌다.
//    「나중에 치울 것」 목록에 올라 있다 —
//    docs/superpowers/specs/2026-08-17-app-community-list-layout-design.md
```

- [ ] **5단계: 통과하는지 확인한다**

```bash
cd /Users/osejin/Desktop/cuddle-market/mobile && npx jest __tests__/community-list 2>&1 | tail -10
```

옛 시험 중 `검색한다()` 도우미를 쓰던 것들(검색어를 치는 시험 셋)은 **칸이 없어졌으므로** 주소값(`mock주소값.keyword`)을 넣는 방식으로 고친다. 지키는 내용(검색어가 조건에 실리는가·풀리는가)은 **그대로 둔다.**

- [ ] **6단계: 게이트**

```bash
cd /Users/osejin/Desktop/cuddle-market && pnpm gate:mobile 2>&1 | tail -5
```
기대: `EXIT=0`

- [ ] **7단계: 리드에게 보고**

⚠️ 보고에 **이걸 꼭 적어라** — `router.replace({ pathname: '/(tabs)/(community)', params })` 로 탭 화면에 검색어를 돌려주는 길은 **jest 로 증명되지 않는다**(주소 이동을 흉내 냈을 뿐이다). 실기기에서 「돋보기 → 검색어 치고 확인 → 목록에 걸리는가」를 반드시 눈으로 봐야 한다. 안 되면 `router.dismissTo` 로 바꿔 보는 것이 다음 후보다.

---

## 실기기로 봐야 하는 것 (전 과제 끝난 뒤)

jsdom 이 못 보는 것들이다. 이게 마지막 게이트다.

```
1. 커뮤니티 탭에서 [질문 있어요] ↔ [정보 공유] 를 오간다
   → 밑줄 바가 **미끄러져** 가는가 (툭 갈아 끼워지면 안 된다)
2. 헤더 오른쪽 돋보기를 누른다 → 검색 화면이 뜨고 자판이 바로 올라오는가
3. 검색어를 치고 확인 → **커뮤니티 목록으로 돌아오면서** 검색어가 걸리는가
   → 이때 게시판 탭 · 정렬 줄 · 하단 탭바가 **그대로 보이는가** ← 이번 설계의 핵심
4. 검색 줄에서 뒤로(‹) → 검색이 풀리고 평소 헤더로 돌아오는가
5. 목록을 스크롤한다 → 탭과 정렬 줄이 **안 사라지는가**
6. 검색 결과가 0건일 때 → 탭과 정렬 줄이 여전히 보이는가 (되돌릴 길)
7. 홈(상품) 화면이 **전과 똑같은가** — 대분류 탭·바·스크롤 따라오기
   ⚠️ 과제 1에서 조각을 옮겼다. 여기서 달라졌으면 그때 생긴 것이다
```
