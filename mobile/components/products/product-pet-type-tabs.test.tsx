import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { getAnimatedStyle } from 'react-native-reanimated';

import { PET_DETAIL_OPTIONS_BY_TYPE, PET_TYPE_OPTIONS } from '@cuddle/shared';

import { colors } from '@/constants/colors';
import { ProductPetTypeTabs } from './product-filter-row';

// 대분류 탭 줄. **목록 밖에 서는 조각이다** — 스크롤해도 화면에 남는다(#855 후속).
// 소분류·카테고리 줄의 시험은 product-filter-row.test.tsx 에 있다.
//
// ⚠️ render·rerender·fireEvent는 기다려야 한다(mobile/AGENTS.md) — 안 그러면 조용히 틀린 게 통과한다.
//
// ⚠️ 누를 때는 글자가 아니라 **표식(testID)**으로 누른다. 글자는 단추 **안쪽**이라
//    누름이 단추까지 안 올라갈 때가 있다.
//      대분류 탭  pet-type-tab-<코드 | ALL>

const FIRST_PET = PET_TYPE_OPTIONS[0]; // 포유류
const SECOND_PET = PET_TYPE_OPTIONS[1]; // 조류
const FIRST_DETAIL = PET_DETAIL_OPTIONS_BY_TYPE[FIRST_PET.code][0]; // 강아지

/** 탭 아래 바가 미끄러지는 시간(조각의 TAB_SLIDE_MS = 240)보다 넉넉히 큰 값. */
const 애니메이션_넉넉히 = 800;

function renderTabs(overrides: Partial<Parameters<typeof ProductPetTypeTabs>[0]> = {}) {
  const onChangePetType = jest.fn();
  const onChangePetDetailType = jest.fn();
  const props = {
    petType: null,
    petDetailType: null,
    onChangePetType,
    onChangePetDetailType,
    ...overrides,
  };
  return { onChangePetType, onChangePetDetailType, props };
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

it('아무것도 안 골랐으면 「전체」 탭이 골라진 상태다', async () => {
  const { props } = renderTabs({ petType: null });
  await render(<ProductPetTypeTabs {...props} />);

  expect(screen.getByTestId('pet-type-tab-ALL').props.accessibilityState.selected).toBe(true);
  expect(
    screen.getByTestId(`pet-type-tab-${FIRST_PET.code}`).props.accessibilityState.selected,
  ).toBe(false);
});

it('대분류 탭을 누르면 onChangePetType이 그 코드로 불린다', async () => {
  const { props, onChangePetType } = renderTabs();
  await render(<ProductPetTypeTabs {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-type-tab-${FIRST_PET.code}`));

  expect(onChangePetType).toHaveBeenCalledWith(FIRST_PET.code);
});

it('고른 대분류 탭을 다시 눌러도 안 풀린다 (같은 코드로 알린다)', async () => {
  // 탭은 「지금 여기」를 가리키는 표시라, 눌렀는데 아무 데도 안 가면 어색하다.
  // 되돌리려면 맨 앞 「전체」 탭으로 간다 — 알약(소분류·카테고리)과 다른 점이다.
  const { props, onChangePetType, onChangePetDetailType } = renderTabs({
    petType: FIRST_PET.code,
  });
  await render(<ProductPetTypeTabs {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-type-tab-${FIRST_PET.code}`));

  expect(onChangePetType).toHaveBeenCalledWith(FIRST_PET.code);
  expect(onChangePetType).not.toHaveBeenCalledWith(null);
  // 같은 대분류를 다시 고른 것이니 소분류도 안 건드린다
  expect(onChangePetDetailType).not.toHaveBeenCalled();
});

it('고른 것이 선택 상태로 표시된다', async () => {
  const { props } = renderTabs({ petType: FIRST_PET.code });
  await render(<ProductPetTypeTabs {...props} />);

  expect(screen.getByRole('button', { name: FIRST_PET.label, selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: SECOND_PET.label, selected: false })).toBeTruthy();
});

// ── 대분류를 바꾸면 소분류를 푼다 ───────────────────────────────────
//
// ⚠️ **이 로직이 대분류 탭과 함께 옮겨 왔다**(#855 후속에서 조각을 나누며).
//    두고 왔으면 「조류 + 강아지」처럼 서로 맞지 않는 조건이 서버로 간다.
//    그래서 이 조각은 소분류를 그리지 않으면서도 소분류 값과 콜백을 받는다.

it('대분류를 다른 것으로 바꾸면 고른 소분류를 푼다', async () => {
  const { props, onChangePetType, onChangePetDetailType } = renderTabs({
    petType: FIRST_PET.code,
    petDetailType: FIRST_DETAIL.code,
  });
  await render(<ProductPetTypeTabs {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-type-tab-${SECOND_PET.code}`));

  expect(onChangePetType).toHaveBeenCalledWith(SECOND_PET.code);
  expect(onChangePetDetailType).toHaveBeenCalledWith(null);
});

it('「전체」 탭으로 돌아가면 대분류도 소분류도 푼다', async () => {
  const { props, onChangePetType, onChangePetDetailType } = renderTabs({
    petType: FIRST_PET.code,
    petDetailType: FIRST_DETAIL.code,
  });
  await render(<ProductPetTypeTabs {...props} />);

  // 고른 탭을 다시 누르는 게 아니라 맨 앞 「전체」 탭으로 간다
  await fireEvent.press(screen.getByTestId('pet-type-tab-ALL'));

  expect(onChangePetType).toHaveBeenCalledWith(null);
  expect(onChangePetDetailType).toHaveBeenCalledWith(null);
});

it('같은 대분류를 다시 고르는 게 아니면 소분류가 없을 때는 안 푼다', async () => {
  const { props, onChangePetDetailType } = renderTabs({
    petType: FIRST_PET.code,
    petDetailType: null,
  });
  await render(<ProductPetTypeTabs {...props} />);

  await fireEvent.press(screen.getByTestId(`pet-type-tab-${SECOND_PET.code}`));

  expect(onChangePetDetailType).not.toHaveBeenCalled();
});

// ── 탭 아래 바가 미끄러진다 (실기기 요청 1) ─────────────────────────
//
// 「툭툭 끊긴다」는 말은 바가 탭마다 따로 켜졌다 꺼져서 나온 것이다. 바가 **하나**여야
// 옆으로 옮겨 갈 수 있다.

it('바는 탭마다가 아니라 줄에 하나뿐이다', async () => {
  const { props } = renderTabs();
  await render(<ProductPetTypeTabs {...props} />);

  expect(screen.getAllByTestId('pet-type-tab-bar')).toHaveLength(1);
});

it('탭 자리를 재고 나면 바가 고른 탭에 가서 붙는다', async () => {
  const { props } = renderTabs({ petType: null });
  await render(<ProductPetTypeTabs {...props} />);

  await 자리를알려준다({ ALL: { x: 0, width: 60 }, [FIRST_PET.code]: { x: 60, width: 80 } });

  // 「전체」가 골라져 있으니 그 자리다. 처음 한 번은 미끄러지지 않고 곧바로 놓인다
  await waitFor(() => expect(바자리()).toEqual({ x: 0, width: 60 }));
});

it('다른 탭을 고르면 바가 그 자리·그 너비로 옮겨 간다', async () => {
  const { props } = renderTabs({ petType: null });
  const view = await render(<ProductPetTypeTabs {...props} />);

  await 자리를알려준다({ ALL: { x: 0, width: 60 }, [FIRST_PET.code]: { x: 60, width: 80 } });
  await waitFor(() => expect(바자리()).toEqual({ x: 0, width: 60 }));

  await view.rerender(<ProductPetTypeTabs {...props} petType={FIRST_PET.code} />);

  // 곧바로 갈아 끼워지지 않는다 — 미끄러지는 중이다
  expect(바자리().x).toBeLessThan(60);

  // 너비도 함께 움직인다. 자리만 옮기면 글자 길이가 다른 탭에서 폭이 튄다
  await waitFor(() => expect(바자리()).toEqual({ x: 60, width: 80 }), {
    timeout: 애니메이션_넉넉히,
  });
});

// ── 배경색 (실기기 요청 2 + #855 후속) ──────────────────────────────

it('대분류 탭 줄이 자기 흰 바탕을 가진다', async () => {
  // ⚠️ 목록 밖으로 나오면서 **자기 배경이 꼭 필요해졌다.** 예전에는 세 줄을 통째로
  //    덮던 바깥 상자가 대신 덮어 줬을 뿐이다. 없으면 홈 배경(#F9FAFB)이 비쳐
  //    이 줄만 회색으로 보인다 — 바로 아래 툴바가 흰색이라 더 도드라진다.
  const { props } = renderTabs({ petType: FIRST_PET.code });
  await render(<ProductPetTypeTabs {...props} />);

  const 흰색 = { backgroundColor: colors.surface };
  expect(screen.getByTestId('product-pet-type-tabs')).toHaveStyle(흰색);
  expect(screen.getByTestId('pet-type-tab-row')).toHaveStyle(흰색);
});
