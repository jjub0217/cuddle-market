import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { PostSearchInput } from './post-search-input';

// ⚠️ render·rerender·fireEvent 는 셋 다 기다려야 한다(mobile/AGENTS.md) —
//    안 그러면 오류 없이 옛 값을 줘서 조용히 틀린 것을 통과시킨다.

const INPUT = 'post-search-input';

it('웹과 같은 안내 글자를 쓴다', async () => {
  // 문구를 새로 짓지 않는다. 웹 CommunityPage.tsx:219 에서 가져왔다.
  await render(<PostSearchInput keyword="" onSubmit={jest.fn()} />);

  expect(screen.getByPlaceholderText('궁금한 내용을 검색해보세요')).toBeTruthy();
});

it('확인 키를 누르면 앞뒤 공백을 뗀 검색어로 알린다', async () => {
  const onSubmit = jest.fn();
  await render(<PostSearchInput keyword="" onSubmit={onSubmit} />);

  await fireEvent.changeText(screen.getByTestId(INPUT), '  강아지 사료  ');
  await fireEvent(screen.getByTestId(INPUT), 'submitEditing');

  expect(onSubmit).toHaveBeenCalledWith('강아지 사료');
});

it('비운 채로 확인하면 **빈 글자로** 알린다 — 전체 목록으로 돌아가는 길이다', async () => {
  // ⚠️ products/search-bar-header 와 다른 점이다. 거긴 빈 검색어를 아예 안 넘긴다
  //    (`if (!normalized) return`). 커뮤니티는 지우면 원래대로 돌아와야 한다.
  const onSubmit = jest.fn();
  await render(<PostSearchInput keyword="사료" onSubmit={onSubmit} />);

  await fireEvent.changeText(screen.getByTestId(INPUT), '');
  await fireEvent(screen.getByTestId(INPUT), 'submitEditing');

  expect(onSubmit).toHaveBeenCalledWith('');
});

it('공백만 쳐도 빈 글자로 알린다', async () => {
  const onSubmit = jest.fn();
  await render(<PostSearchInput keyword="" onSubmit={onSubmit} />);

  await fireEvent.changeText(screen.getByTestId(INPUT), '   ');
  await fireEvent(screen.getByTestId(INPUT), 'submitEditing');

  expect(onSubmit).toHaveBeenCalledWith('');
});

it('치는 동안에는 안 알린다 — 확인 키를 눌러야 한다', async () => {
  // 한 글자마다 서버를 부르면 목록이 계속 깜빡인다.
  const onSubmit = jest.fn();
  await render(<PostSearchInput keyword="" onSubmit={onSubmit} />);

  await fireEvent.changeText(screen.getByTestId(INPUT), '사');
  await fireEvent.changeText(screen.getByTestId(INPUT), '사료');

  expect(onSubmit).not.toHaveBeenCalled();
});

it('글자가 있으면 지우기가 보이고, 누르면 **곧바로** 빈 글자로 알린다', async () => {
  // ⚠️ 지우기는 확인 키를 또 누르게 하지 않는다. 「지웠는데 목록이 그대로」가 되면 안 된다.
  const onSubmit = jest.fn();
  await render(<PostSearchInput keyword="사료" onSubmit={onSubmit} />);

  await fireEvent.press(screen.getByLabelText('입력 내용 지우기'));

  expect(onSubmit).toHaveBeenCalledWith('');
  expect(screen.getByTestId(INPUT).props.value).toBe('');
});

it('글자가 없으면 지우기가 안 보인다', async () => {
  await render(<PostSearchInput keyword="" onSubmit={jest.fn()} />);

  expect(screen.queryByLabelText('입력 내용 지우기')).toBeNull();
});

it('밖에서 검색어가 바뀌면 칸도 따라간다', async () => {
  // 탭을 바꾸면 검색어가 풀린다(설계 §4). 그때 칸에 옛 글자가 남으면
  // 「지웠는데 그대로」로 보인다.
  const view = await render(<PostSearchInput keyword="사료" onSubmit={jest.fn()} />);
  expect(screen.getByTestId(INPUT).props.value).toBe('사료');

  await view.rerender(<PostSearchInput keyword="" onSubmit={jest.fn()} />);

  expect(screen.getByTestId(INPUT).props.value).toBe('');
});

it('치는 동안 밖이 그대로면 친 글자를 안 건드린다', async () => {
  // ⚠️ value 를 밖의 값에 바로 묶으면 **글자를 칠 수가 없다** — 확인 키를 눌러야
  //    밖이 바뀌기 때문이다. 안에 따로 들고 있다가 밖이 바뀔 때만 맞춘다.
  const view = await render(<PostSearchInput keyword="" onSubmit={jest.fn()} />);

  await fireEvent.changeText(screen.getByTestId(INPUT), '고양이');
  // 부모가 다른 이유로 다시 그려도(검색어는 그대로) 친 글자가 살아 있어야 한다
  await view.rerender(<PostSearchInput keyword="" onSubmit={jest.fn()} />);

  expect(screen.getByTestId(INPUT).props.value).toBe('고양이');
});
