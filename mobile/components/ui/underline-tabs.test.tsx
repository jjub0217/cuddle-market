import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { UnderlineTabs } from '@/components/ui/underline-tabs';

// 홈(상품 대분류)에서 뽑아낸 조각이라 **전과 똑같이 도는지**가 핵심이다.
// 홈이 전과 같은지는 상품 쪽 기존 시험이 지킨다(하나도 안 고쳤다).
// 여기서는 이 조각 자체의 약속과, **커뮤니티처럼 「전체」 없이 쓰는 경우**를 지킨다.

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
    <UnderlineTabs selected="QUESTION" options={게시판} onChange={바뀜} testIDPrefix="board-tab" />
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
    <UnderlineTabs selected="INFO" options={게시판} onChange={() => {}} testIDPrefix="board-tab" />
  );

  expect(screen.getByTestId('board-tab-INFO').props.accessibilityState).toMatchObject({
    selected: true,
  });
  expect(screen.getByTestId('board-tab-QUESTION').props.accessibilityState).toMatchObject({
    selected: false,
  });
});

it('고른 탭과 안 고른 탭의 줄 높이가 같다', async () => {
  // ⚠️ **고른 탭만 글자가 한 단계 크다.** 색(accent)이 안 고른 탭의 회색보다 오히려 흐려서
  //    「지금 여기」가 약했기 때문이다. 그런데 줄 높이를 안 맞추면 글자 상자가 같이 커져
  //    **탭을 오갈 때 줄이 위아래로 들썩인다.**
  //
  //    jsdom 은 배치를 모르지만 **값이 같은지**는 여기서 지킬 수 있다.
  await render(
    <UnderlineTabs selected="QUESTION" options={게시판} onChange={() => {}} testIDPrefix="board-tab" />
  );

  const 고른것 = StyleSheet.flatten(screen.getByText('질문 있어요').props.style);
  const 안고른것 = StyleSheet.flatten(screen.getByText('정보 공유').props.style);

  expect(고른것.lineHeight).toBe(안고른것.lineHeight);
  // 크기는 일부러 다르다 — 그 차이를 줄 높이가 흡수한다
  expect(고른것.fontSize).toBeGreaterThan(안고른것.fontSize);
});
