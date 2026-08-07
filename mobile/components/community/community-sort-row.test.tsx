import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { CommunitySortRow, COMMUNITY_SORT_TYPES } from './community-sort-row';

// ⚠️ render·fireEvent 는 기다려야 한다(mobile/AGENTS.md) — 안 그러면 오류 없이 옛 값을 줘서
//    조용히 틀린 것을 통과시킨다.
//
// ⚠️ 누를 때는 글자가 아니라 **표식(testID)**으로. 글자는 단추 **안쪽**이라 누름이 단추까지
//    안 올라갈 때가 있다.

it('정렬 셋이 다 보인다', async () => {
  await render(<CommunitySortRow sortBy="latest" onChange={jest.fn()} />);

  expect(screen.getByText('최신순')).toBeTruthy();
  expect(screen.getByText('조회 순')).toBeTruthy();
  expect(screen.getByText('댓글 순')).toBeTruthy();
});

it('웹 COMMUNITY_SORT_TYPE 과 같은 셋이다', async () => {
  // ⚠️ 서버에는 oldest(오래된 순)도 있지만 웹이 안 쓴다. 우리도 안 쓴다(설계 §2).
  //    넷째가 슬그머니 들어오지 않게 못을 박는다.
  expect(COMMUNITY_SORT_TYPES.map((sort) => sort.id)).toEqual(['latest', 'views', 'comments']);
});

it('누르면 그 id 로 알린다', async () => {
  const onChange = jest.fn();
  await render(<CommunitySortRow sortBy="latest" onChange={onChange} />);

  await fireEvent.press(screen.getByTestId('community-sort-views'));

  expect(onChange).toHaveBeenCalledWith('views');
});

it('지금 고른 것이 선택 상태로 표시된다', async () => {
  await render(<CommunitySortRow sortBy="comments" onChange={jest.fn()} />);

  expect(screen.getByRole('button', { name: '댓글 순', selected: true })).toBeTruthy();
  expect(screen.getByRole('button', { name: '최신순', selected: false })).toBeTruthy();
});

it('고른 것을 다시 눌러도 그 id 로 알린다 (안 풀린다)', async () => {
  // 탭·정렬은 「지금 여기」를 가리키는 표시다. 눌렀는데 아무 데도 안 가면 어색하다.
  // 알약(켜고 끄는 것)과 다른 점이라 못을 박는다.
  const onChange = jest.fn();
  await render(<CommunitySortRow sortBy="views" onChange={onChange} />);

  await fireEvent.press(screen.getByTestId('community-sort-views'));

  expect(onChange).toHaveBeenCalledWith('views');
});

it('모르는 정렬 값이 와도 터지지 않는다', async () => {
  // 서버는 모르는 sortBy 를 조용히 무시한다. 화면도 조용히 넘어가야 한다.
  await render(<CommunitySortRow sortBy="mystery" onChange={jest.fn()} />);

  expect(screen.getByRole('button', { name: '최신순', selected: false })).toBeTruthy();
});
