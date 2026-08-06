import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import React from 'react';
import { getAnimatedStyle } from 'react-native-reanimated';

import { CATEGORY_OPTIONS, PET_DETAIL_OPTIONS_BY_TYPE, PET_TYPE_OPTIONS } from '@cuddle/shared';

import { ProductFilterRow } from './product-filter-row';

// ⚠️ render·rerender·fireEvent는 기다려야 한다(mobile/AGENTS.md) — 안 그러면 조용히 틀린 게 통과한다.
//
// ⚠️ 누를 때는 글자가 아니라 **표식(testID)**으로 누른다. 글자는 단추 **안쪽**이라
//    누름이 단추까지 안 올라갈 때가 있다.
//      대분류 탭   pet-type-tab-<코드 | ALL>
//      소분류 알약 pet-detail-pill-<코드 | ALL>
//      카테고리    category-tile-<코드>

const FIRST_PET = PET_TYPE_OPTIONS[0]; // 포유류
const SECOND_PET = PET_TYPE_OPTIONS[1]; // 조류
const FIRST_DETAIL = PET_DETAIL_OPTIONS_BY_TYPE[FIRST_PET.code][0]; // 강아지

/** 펼쳐진 소분류 줄의 높이. 조각의 DETAIL_ROW_HEIGHT와 같은 값이다. */
const DETAIL_ROW_HEIGHT = 50;

/** 접힘·펼침에 걸리는 시간(조각의 COLLAPSE_MS = 260)보다 넉넉히 큰 값. */
const 애니메이션_넉넉히 = 800;

function renderRow(overrides: Partial<Parameters<typeof ProductFilterRow>[0]> = {}) {
  const onChangePetType = jest.fn();
  const onChangePetDetailType = jest.fn();
  const onChangeCategory = jest.fn();
  const props = {
    petType: null,
    petDetailType: null,
    category: null,
    onChangePetType,
    onChangePetDetailType,
    onChangeCategory,
    ...overrides,
  };
  return { onChangePetType, onChangePetDetailType, onChangeCategory, props };
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

/** 탭 아래 바가 지금 어디에 얼마만 한 너비로 있는지. */
function 바자리() {
  const style = getAnimatedStyle(screen.getByTestId('pet-type-tab-bar')) as {
    width: number;
    transform: { translateX: number }[];
  };
  return { x: style.transform[0].translateX, width: style.width };
}

/**
 * 탭이 어디에 놓였는지를 앱 대신 알려 준다.
 *
 * ⚠️ 시험에서는 **자리를 재 주는 사람이 없다** — `onLayout`이 저절로 안 불린다.
 *    그래서 실제 화면에서 재졌을 값을 손으로 넣어 준다. 이걸 안 하면 바의 너비가
 *    0에 머물러 「바가 안 움직인다」로 보인다(조각 잘못이 아니다).
 *
 * ⚠️ `fireEvent`를 **기다려야 한다**(mobile/AGENTS.md). 안 기다리면 이 시험만 깨지는 게 아니라
 *    **뒤에 오는 시험 전부가 「못 찾겠다」로 무너진다** — 여기서 실제로 17개가 그렇게 깨졌다.
 */
async function 자리를알려준다(자리들: Record<string, { x: number; width: number }>) {
  for (const [key, { x, width }] of Object.entries(자리들)) {
    await fireEvent(screen.getByTestId(`pet-type-tab-${key}`), 'layout', {
      nativeEvent: { layout: { x, y: 0, width, height: 44 } },
    });
  }
}

it('두 줄이 다 보인다 (대분류 하나, 카테고리 하나)', async () => {
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  expect(screen.getByText(FIRST_PET.label)).toBeTruthy();
  expect(screen.getByText(CATEGORY_OPTIONS[0].label)).toBeTruthy();
});

it('「전체」는 대분류 줄에만 있고 카테고리 줄에는 없다', async () => {
  // 카테고리는 그림 줄이라 「전체」 그림을 지어내지 않는다. 아무것도 안 고른 상태가 전체이고,
  // 되돌릴 때는 고른 것을 다시 누른다 — 웹 CategoryFilter.tsx 와 같다.
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  // 렌더 순서: [전체, 대분류 9개, 카테고리 8개] — 줄 둘이 이어서 그려진다
  // (대분류가 「전체」라 소분류 줄은 접혀 있고 안이 비어 있다)
  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(1 + PET_TYPE_OPTIONS.length + CATEGORY_OPTIONS.length);
  expect(within(buttons[0]).getByText('전체')).toBeTruthy();
  // 「전체」는 화면을 통틀어 하나뿐이다
  expect(screen.getAllByText('전체')).toHaveLength(1);
});

it('아무것도 안 골랐으면 「전체」 탭이 골라진 상태다', async () => {
  const { props } = renderRow({ petType: null });
  await render(<ProductFilterRow {...props} />);

  expect(screen.getByTestId('pet-type-tab-ALL').props.accessibilityState.selected).toBe(true);
  expect(
    screen.getByTestId(`pet-type-tab-${FIRST_PET.code}`).props.accessibilityState.selected,
  ).toBe(false);
});

it('대분류 탭을 누르면 onChangePetType이 그 코드로 불린다', async () => {
  const { props, onChangePetType } = renderRow();
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-type-tab-${FIRST_PET.code}`));

  expect(onChangePetType).toHaveBeenCalledWith(FIRST_PET.code);
});

it('카테고리를 누르면 onChangeCategory가 그 코드로 불린다', async () => {
  const { props, onChangeCategory } = renderRow();
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`category-tile-${CATEGORY_OPTIONS[0].code}`));

  expect(onChangeCategory).toHaveBeenCalledWith(CATEGORY_OPTIONS[0].code);
});

it('고른 대분류 탭을 다시 눌러도 안 풀린다 (같은 코드로 알린다)', async () => {
  // 탭은 「지금 여기」를 가리키는 표시라, 눌렀는데 아무 데도 안 가면 어색하다.
  // 되돌리려면 맨 앞 「전체」 탭으로 간다 — 알약(소분류·카테고리)과 다른 점이다.
  const { props, onChangePetType, onChangePetDetailType } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-type-tab-${FIRST_PET.code}`));

  expect(onChangePetType).toHaveBeenCalledWith(FIRST_PET.code);
  expect(onChangePetType).not.toHaveBeenCalledWith(null);
  // 같은 대분류를 다시 고른 것이니 소분류도 안 건드린다
  expect(onChangePetDetailType).not.toHaveBeenCalled();
});

it('고른 것이 선택 상태로 표시된다', async () => {
  const { props } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  expect(screen.getByRole('button', { name: FIRST_PET.label, selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: SECOND_PET.label, selected: false })).toBeTruthy();
});

it('대분류를 눌러도 카테고리 쪽 콜백은 안 불린다', async () => {
  const { props, onChangeCategory } = renderRow();
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-type-tab-${FIRST_PET.code}`));

  expect(onChangeCategory).not.toHaveBeenCalled();
});

// ── 탭 아래 바가 미끄러진다 (실기기 요청 1) ─────────────────────────
//
// 「툭툭 끊긴다」는 말은 바가 탭마다 따로 켜졌다 꺼져서 나온 것이다. 바가 **하나**여야
// 옆으로 옮겨 갈 수 있다.

it('바는 탭마다가 아니라 줄에 하나뿐이다', async () => {
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  expect(screen.getAllByTestId('pet-type-tab-bar')).toHaveLength(1);
});

it('탭 자리를 재고 나면 바가 고른 탭에 가서 붙는다', async () => {
  const { props } = renderRow({ petType: null });
  await render(<ProductFilterRow {...props} />);

  await 자리를알려준다({ ALL: { x: 0, width: 60 }, [FIRST_PET.code]: { x: 60, width: 80 } });

  // 「전체」가 골라져 있으니 그 자리다. 처음 한 번은 미끄러지지 않고 곧바로 놓인다
  await waitFor(() => expect(바자리()).toEqual({ x: 0, width: 60 }));
});

it('다른 탭을 고르면 바가 그 자리·그 너비로 옮겨 간다', async () => {
  const { props } = renderRow({ petType: null });
  const view = await render(<ProductFilterRow {...props} />);

  await 자리를알려준다({ ALL: { x: 0, width: 60 }, [FIRST_PET.code]: { x: 60, width: 80 } });
  await waitFor(() => expect(바자리()).toEqual({ x: 0, width: 60 }));

  await view.rerender(<ProductFilterRow {...props} petType={FIRST_PET.code} />);

  // 곧바로 갈아 끼워지지 않는다 — 미끄러지는 중이다
  expect(바자리().x).toBeLessThan(60);

  // 너비도 함께 움직인다. 자리만 옮기면 글자 길이가 다른 탭에서 폭이 튄다
  await waitFor(() => expect(바자리()).toEqual({ x: 60, width: 80 }), {
    timeout: 애니메이션_넉넉히,
  });
});

// ── 배경색 (실기기 요청 2) ──────────────────────────────────────────

it('필터 세 줄이 다 흰 바탕이다', async () => {
  // 자기 배경이 없으면 홈 배경(#F9FAFB)이 비쳐 이 부분만 회색으로 보인다.
  // 바로 아래 툴바가 흰색이라 더 도드라진다.
  const { props } = renderRow({ petType: FIRST_PET.code });
  await render(<ProductFilterRow {...props} />);

  const 흰색 = { backgroundColor: '#FFFFFF' };
  // 세 줄을 통째로 덮는 바깥 상자
  expect(screen.getByTestId('product-filter-row')).toHaveStyle(흰색);
  // 줄마다도 자기 바탕을 가진다 — 특히 접히는 소분류 줄은 거기만 비면 접힐 때 회색이 샌다
  expect(screen.getByTestId('pet-type-tab-row')).toHaveStyle(흰색);
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

it('대분류를 다른 것으로 바꾸면 고른 소분류를 푼다', async () => {
  const { props, onChangePetType, onChangePetDetailType } = renderRow({
    petType: FIRST_PET.code,
    petDetailType: FIRST_DETAIL.code,
  });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-type-tab-${SECOND_PET.code}`));

  expect(onChangePetType).toHaveBeenCalledWith(SECOND_PET.code);
  expect(onChangePetDetailType).toHaveBeenCalledWith(null);
});

it('「전체」 탭으로 돌아가면 대분류도 소분류도 푼다', async () => {
  const { props, onChangePetType, onChangePetDetailType } = renderRow({
    petType: FIRST_PET.code,
    petDetailType: FIRST_DETAIL.code,
  });
  await render(<ProductFilterRow {...props} />);

  // 고른 탭을 다시 누르는 게 아니라 맨 앞 「전체」 탭으로 간다
  await fireEvent.press(screen.getByTestId('pet-type-tab-ALL'));

  expect(onChangePetType).toHaveBeenCalledWith(null);
  expect(onChangePetDetailType).toHaveBeenCalledWith(null);
});

it('같은 대분류를 다시 고르는 게 아니면 소분류가 없을 때는 안 푼다', async () => {
  const { props, onChangePetDetailType } = renderRow({
    petType: FIRST_PET.code,
    petDetailType: null,
  });
  await render(<ProductFilterRow {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-type-tab-${SECOND_PET.code}`));

  expect(onChangePetDetailType).not.toHaveBeenCalled();
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

it('카테고리가 4열 2줄이고 왼쪽부터 위·아래 짝으로 채워진다', async () => {
  const { props } = renderRow();
  await render(<ProductFilterRow {...props} />);

  const 윗줄 = screen.getByTestId('category-grid-row-0');
  const 아랫줄 = screen.getByTestId('category-grid-row-1');

  // 여덟 개가 넷씩 두 줄로 갈린다
  expect(within(윗줄).getAllByRole('button')).toHaveLength(4);
  expect(within(아랫줄).getAllByRole('button')).toHaveLength(4);

  // 1·2가 첫 열, 3·4가 둘째 열 — 윗줄은 짝수 자리, 아랫줄은 홀수 자리다
  for (const [index, option] of CATEGORY_OPTIONS.entries()) {
    const 있어야할줄 = index % 2 === 0 ? 윗줄 : 아랫줄;
    expect(within(있어야할줄).getByText(option.label)).toBeTruthy();
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
