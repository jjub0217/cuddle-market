import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';
import { getAnimatedStyle } from 'react-native-reanimated';

import { CATEGORY_OPTIONS, PET_DETAIL_OPTIONS_BY_TYPE, PET_TYPE_OPTIONS } from '@cuddle/shared';

import { colors } from '@/constants/colors';
import { ProductFilterRow } from './product-filter-row';

// 소분류 + 카테고리 두 줄. **목록의 헤더라 스크롤되어 사라지는 조각이다**(#855 후속).
// 늘 고정되는 대분류 탭의 시험은 product-pet-type-tabs.test.tsx 에 있다.
//
// ⚠️ render·rerender·fireEvent는 기다려야 한다(mobile/AGENTS.md) — 안 그러면 조용히 틀린 게 통과한다.
//
// ⚠️ 누를 때는 글자가 아니라 **표식(testID)**으로 누른다. 글자는 단추 **안쪽**이라
//    누름이 단추까지 안 올라갈 때가 있다.
//      소분류 알약 pet-detail-pill-<코드 | ALL>
//      카테고리    category-tile-<코드>

const FIRST_PET = PET_TYPE_OPTIONS[0]; // 포유류
const SECOND_PET = PET_TYPE_OPTIONS[1]; // 조류
const FIRST_DETAIL = PET_DETAIL_OPTIONS_BY_TYPE[FIRST_PET.code][0]; // 강아지

/** 펼쳐진 소분류 줄의 높이. 조각의 DETAIL_ROW_HEIGHT와 같은 값이다. */
const DETAIL_ROW_HEIGHT = 46;

/** 접힘·펼침에 걸리는 시간(조각의 COLLAPSE_MS = 400)보다 넉넉히 큰 값. */
const 애니메이션_넉넉히 = 800;

function renderRow(overrides: Partial<Parameters<typeof ProductFilterRow>[0]> = {}) {
  const onChangePetDetailType = jest.fn();
  const onChangeCategory = jest.fn();
  const props = {
    petType: null,
    petDetailType: null,
    category: null,
    onChangePetDetailType,
    onChangeCategory,
    ...overrides,
  };
  return { onChangePetDetailType, onChangeCategory, props };
}

/**
 * 소분류 줄의 지금 높이. 0이면 접혀 있다.
 *
 * ⚠️ `props.style`을 읽으면 안 된다. Reanimated는 애니메이션이 도는 동안 그 값을 안 고친다 —
 *    처음 값만 들어 있어 **접혔는지 펼쳤는지를 조용히 틀리게 답한다**. 지금 값은
 *    Reanimated가 주는 `getAnimatedStyle`로 읽어야 한다.
 */
function 소분류줄높이() {
  const style = getAnimatedStyle(screen.getByTestId('pet-detail-collapse')) as { height: number };
  return style.height;
}

it('소분류와 카테고리 두 줄이 다 보인다', async () => {
  const { props } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  expect(screen.getByText(FIRST_DETAIL.label)).toBeTruthy();
  expect(screen.getByText(CATEGORY_OPTIONS[0].label)).toBeTruthy();
});

it('「전체」는 소분류 줄에만 있고 카테고리 줄에는 없다', async () => {
  // 카테고리는 그림 줄이라 「전체」 그림을 지어내지 않는다. 아무것도 안 고른 상태가 전체이고,
  // 되돌릴 때는 고른 것을 다시 누른다 — 웹 CategoryFilter.tsx 와 같다.
  const { props } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  // 렌더 순서: [전체, 소분류 n개, 카테고리 8개] — 줄 둘이 이어서 그려진다
  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(
    1 + PET_DETAIL_OPTIONS_BY_TYPE[FIRST_PET.code].length + CATEGORY_OPTIONS.length,
  );
  expect(within(buttons[0]).getByText('전체')).toBeTruthy();
  // 「전체」는 이 조각을 통틀어 하나뿐이다 (대분류 줄의 「전체」는 다른 조각에 있다)
  expect(screen.getAllByText('전체')).toHaveLength(1);
});

it('카테고리를 누르면 onChangeCategory가 그 코드로 불린다', async () => {
  const { props, onChangeCategory } = renderRow();
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`category-tile-${CATEGORY_OPTIONS[0].code}`));

  expect(onChangeCategory).toHaveBeenCalledWith(CATEGORY_OPTIONS[0].code);
});

it('소분류를 눌러도 카테고리 쪽 콜백은 안 불린다', async () => {
  const { props, onChangeCategory } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-detail-pill-${FIRST_DETAIL.code}`));

  expect(onChangeCategory).not.toHaveBeenCalled();
});

// ── 배경색 (실기기 요청 2) ──────────────────────────────────────────

it('필터 두 줄이 다 흰 바탕이다', async () => {
  // 자기 배경이 없으면 홈 배경(#F9FAFB)이 비쳐 이 부분만 회색으로 보인다.
  // 바로 아래 툴바가 흰색이라 더 도드라진다.
  const { props } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  const 흰색 = { backgroundColor: colors.surface };
  // 두 줄을 통째로 덮는 바깥 상자
  expect(screen.getByTestId('product-filter-row')).toHaveStyle(흰색);
  // 줄마다도 자기 바탕을 가진다 — 특히 접히는 소분류 줄은 거기만 비면 접힐 때 회색이 샌다
  expect(screen.getByTestId('pet-detail-collapse')).toHaveStyle(흰색);
  expect(screen.getByTestId('category-grid')).toHaveStyle(흰색);
});

// ── 소분류 줄 (Task 2) ──────────────────────────────────────────────

it('대분류가 「전체」면 소분류 줄이 아예 없다', async () => {
  const { props } = renderRow({ petType: null });
  await render(<ProductFilterRow {...props} />);

  // 어느 대분류의 세부든 하나도 안 보여야 한다
  for (const options of Object.values(PET_DETAIL_OPTIONS_BY_TYPE)) {
    for (const option of options) {
      expect(screen.queryByText(option.label)).toBeNull();
    }
  }
});

it('대분류를 고르면 그 대분류의 소분류만 나온다', async () => {
  const { props } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  for (const option of PET_DETAIL_OPTIONS_BY_TYPE[FIRST_PET.code]) {
    expect(screen.getByText(option.label)).toBeTruthy();
  }
  // 다른 대분류(조류)의 세부는 안 나온다
  for (const option of PET_DETAIL_OPTIONS_BY_TYPE[SECOND_PET.code]) {
    expect(screen.queryByText(option.label)).toBeNull();
  }
});

it('소분류를 누르면 onChangePetDetailType이 그 코드로 불린다', async () => {
  const { props, onChangePetDetailType } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-detail-pill-${FIRST_DETAIL.code}`));

  expect(onChangePetDetailType).toHaveBeenCalledWith(FIRST_DETAIL.code);
});

it('고른 소분류를 다시 누르면 null로 알린다 (알약은 풀린다)', async () => {
  const { props, onChangePetDetailType } = renderRow({
    petType: FIRST_PET.code,
    petDetailType: FIRST_DETAIL.code,
  });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-detail-pill-${FIRST_DETAIL.code}`));

  expect(onChangePetDetailType).toHaveBeenCalledWith(null);
});

it('대분류가 바뀌면 소분류 줄의 내용도 바뀐다', async () => {
  const { props } = renderRow({ petType: FIRST_PET.code });
  const view = await render(<ProductFilterRow {...props} />);

  expect(screen.getByText(FIRST_DETAIL.label)).toBeTruthy();

  await view.rerender(<ProductFilterRow {...props} petType={SECOND_PET.code} />);

  expect(screen.queryByText(FIRST_DETAIL.label)).toBeNull();
  expect(screen.getByText(PET_DETAIL_OPTIONS_BY_TYPE[SECOND_PET.code][0].label)).toBeTruthy();
});

// ── 소분류 줄이 접혔다 펼쳐진다 (실기기 요청 2) ──────────────────────
//
// 애니메이션이 **어디서 시작해 어디서 끝나는지**를 본다. 그동안 값이 진짜로 움직이므로
// 끝값은 `waitFor`로 기다린다.
//
// ⚠️ **가짜 시계(`jest.useFakeTimers`)를 쓰지 마라.** 시간을 밀면 그 뒤로는 `render`가
//    아무것도 안 그려서, **뒤에 오는 시험들이 통째로 「못 찾겠다」로 깨진다.**
//    (여기서 실제로 6개가 깨졌다 — 원인이 이 파일 안이 아니라 앞 시험이라 찾기 어렵다.)
//
// ⚠️ 여기서 못 잡는 것: 움직임이 실제로 부드러운가, 안드로이드에서 프레임을 따라가는가.
//    그건 실기기 몫이다(place-sheet에서 실제로 걸렸던 자리다 — place-sheet.tsx 29~37줄).

it('대분류가 「전체」면 소분류 줄이 높이 0으로 접혀 있다', async () => {
  const { props } = renderRow({ petType: null });
  await render(<ProductFilterRow {...props} />);

  expect(소분류줄높이()).toBe(0);
});

it('대분류를 고르면 접힌 데서 시작해 제 높이까지 펼쳐진다', async () => {
  const { props } = renderRow({ petType: null });
  const view = await render(<ProductFilterRow {...props} />);

  expect(소분류줄높이()).toBe(0);

  await view.rerender(<ProductFilterRow {...props} petType={FIRST_PET.code} />);
  // 툭 나타나는 게 아니라 아직 「자라나는」 중이다
  expect(소분류줄높이()).toBeLessThan(DETAIL_ROW_HEIGHT);

  await waitFor(() => expect(소분류줄높이()).toBe(DETAIL_ROW_HEIGHT), {
    timeout: 애니메이션_넉넉히,
  });
});

it('대분류를 A에서 B로 바꿔도 펼친 채로 있고 알약만 바뀐다', async () => {
  // ⚠️ 접었다 폈다 하면 아래 카테고리 격자가 두 번 출렁여 화면이 튄다.
  const { props } = renderRow({ petType: FIRST_PET.code });
  const view = await render(<ProductFilterRow {...props} />);

  expect(소분류줄높이()).toBe(DETAIL_ROW_HEIGHT);

  await view.rerender(<ProductFilterRow {...props} petType={SECOND_PET.code} />);

  // 바꾸자마자도 높이가 안 흔들린다 — 알약만 갈아 끼운다
  expect(소분류줄높이()).toBe(DETAIL_ROW_HEIGHT);
  expect(screen.getByText(PET_DETAIL_OPTIONS_BY_TYPE[SECOND_PET.code][0].label)).toBeTruthy();

  // 접힘 시간이 다 지나도 그대로다 (중간에 0으로 내려갔다 오지 않는다)
  await new Promise((resolve) => setTimeout(resolve, 애니메이션_넉넉히));
  expect(소분류줄높이()).toBe(DETAIL_ROW_HEIGHT);
});

it('다시 「전체」로 가면 위로 접히고, 다 접힌 뒤에 알약이 치워진다', async () => {
  const { props } = renderRow({ petType: FIRST_PET.code });
  const view = await render(<ProductFilterRow {...props} />);

  await view.rerender(<ProductFilterRow {...props} petType={null} />);

  // 접히는 동안에는 알약이 아직 보인다 — 안 그러면 빈 칸만 접히는 게 보인다
  expect(screen.getByText(FIRST_DETAIL.label)).toBeTruthy();

  await waitFor(() => expect(소분류줄높이()).toBe(0), { timeout: 애니메이션_넉넉히 });
  // 다 접힌 뒤에야 알약이 치워진다
  await waitFor(() => expect(screen.queryByText(FIRST_DETAIL.label)).toBeNull());
});

// ── 카테고리 그림 (Task 3 + 실기기 요청 3) ──────────────────────────

it('카테고리 여덟 개가 다 이름과 함께 나온다', async () => {
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  for (const option of CATEGORY_OPTIONS) {
    expect(screen.getByText(option.label)).toBeTruthy();
  }
});

it('카테고리는 옆으로 밀지 않고 기기 폭에 맞춰 줄바꿈한다', async () => {
  // 줄을 몇 개로 나눌지는 못 박지 않는다 — 좁은 폰은 3~4개씩, 넓은 폰은 5개씩 놓인다.
  // 시험이 지킬 수 있는 것은 「가로로 밀지 않고 넘어가게 돼 있는가」와 「여덟 개가 다 있는가」다.
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  const 격자 = screen.getByTestId('category-grid');
  const 모양 = StyleSheet.flatten(격자.props.style) as {
    flexWrap?: string;
    flexDirection?: string;
  };

  expect(모양.flexDirection).toBe('row');
  expect(모양.flexWrap).toBe('wrap');

  // 여덟 개가 순서대로 다 있다
  expect(within(격자).getAllByRole('button')).toHaveLength(CATEGORY_OPTIONS.length);
  for (const option of CATEGORY_OPTIONS) {
    expect(within(격자).getByText(option.label)).toBeTruthy();
  }
});

it('고른 카테고리가 선택 상태로 표시된다', async () => {
  const { props } = renderRow({ category: CATEGORY_OPTIONS[0].code });
  await render(<ProductFilterRow {...props} />);

  expect(
    screen.getByRole('button', { name: CATEGORY_OPTIONS[0].label, selected: true }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: CATEGORY_OPTIONS[1].label, selected: false }),
  ).toBeTruthy();
});

it('고른 카테고리를 다시 누르면 null로 알린다', async () => {
  const { props, onChangeCategory } = renderRow({ category: CATEGORY_OPTIONS[0].code });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`category-tile-${CATEGORY_OPTIONS[0].code}`));

  expect(onChangeCategory).toHaveBeenCalledWith(null);
});
