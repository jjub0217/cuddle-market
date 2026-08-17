import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import CommunityListScreen from '@/app/(tabs)/(community)/index';

// 커뮤니티 목록 **화면**의 시험.
//
// 조각들(정렬 줄·검색칸)은 각자 시험이 있다. 여기서 지키는 것은
// **그 알림이 서버 요청까지 이어지는가**다 — 중간에 하나만 끊겨도
// 「눌러도 목록이 그대로」가 된다. 탭을 바꿀 때 조건을 푸는 것도 화면에만 있는 일이다.
//
// ⚠️ **왜 `app/` 안에 안 두고 여기 두나 — expo-router 는 `app/` 의 모든 파일을 화면으로 본다.**
//    시험 파일을 거기 두면 앱 번들에 끼워 넣으려다 `@testing-library/react-native` 를 못 찾아
//    **실기기가 아예 안 뜬다**(2026-08-07에 겪었다. `UnableToResolveError`).
//    타입체크도 린트도 안 잡아준다 — 폰에서만 드러난다.
//    앱의 첫 화면 시험이라 여기에 자리를 만든다. 다음 화면 시험도 여기 둔다.

jest.mock('@/lib/community', () => ({
  ...jest.requireActual('@/lib/community'),
  fetchPosts: jest.fn(),
}));

/**
 * 초점을 시험에서 직접 준다.
 *
 * ⚠️ 이름이 **`mock` 으로 시작해야 한다.** 아니면 babel-plugin-jest-hoist 가
 *    `jest.mock` 안에서 밖의 변수를 못 읽게 막아 **파일이 아예 안 돈다.**
 */
const mock초점 = { 돌아온다: () => {} };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  // 진짜는 화면에 초점이 올 때마다 부른다. 시험에서는 **그려지면 첫 초점**으로 보고,
  // 「상세에 갔다 돌아왔다」는 `mock초점.돌아온다()` 로 준다.
  //
  // ⚠️ 이 안에서는 위쪽 import 를 못 쓴다(jest 가 이 함수를 import 보다 먼저 올린다).
  //    react 는 여기서 다시 부른다.
  useFocusEffect: (callback: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect } = require('react') as typeof import('react');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      mock초점.돌아온다 = callback;
      callback();
    }, [callback]);
  },
}));

const { fetchPosts } = jest.requireMock('@/lib/community') as { fetchPosts: jest.Mock };

function 한페이지(items: { id: number; title: string }[] = [], hasNext = false) {
  return {
    hasNext,
    content: items.map((item) => ({
      id: item.id,
      title: item.title,
      contentPreview: '',
      thumbnailImageUrl: null,
      authorNickname: '협주',
      viewCount: 0,
      commentCount: 0,
      createdAt: '2026-08-01T10:00:00',
      updatedAt: '2026-08-01T10:00:00',
      isModified: false,
    })),
  };
}

/** 시험마다 새 클라이언트를 준다 — 앞 시험이 받아 둔 것을 물려받으면 안 된다. */
function 감싸기({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const SEARCH_INPUT = 'post-search-input';

/** 검색칸에 치고 확인 키를 누른다. */
async function 검색한다(글자: string) {
  await fireEvent.changeText(screen.getByTestId(SEARCH_INPUT), 글자);
  await fireEvent(screen.getByTestId(SEARCH_INPUT), 'submitEditing');
}

/** 마지막으로 서버에 넘긴 조건. */
function 마지막조건() {
  return fetchPosts.mock.calls.at(-1)?.[0];
}

/**
 * 목록이 그려지기를 기다린다.
 *
 * ⚠️ **`fetchPosts` 가 불렸다고 목록이 그려진 것은 아니다.** 정렬 줄은 목록의 헤더라
 *    목록이 그려져야 나타난다 — 요청만 기다리고 누르면 「못 찾겠다」로 깨진다.
 */
async function 목록이나오면() {
  await waitFor(() => expect(screen.getByTestId('community-sort-latest')).toBeTruthy());
}

beforeEach(() => {
  fetchPosts.mockReset();
  fetchPosts.mockResolvedValue(한페이지([{ id: 1, title: '강아지 사료 추천' }]));
});

it('처음에는 질문 게시판을 조건 없이 부른다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());
  expect(마지막조건()).toEqual({
    boardType: 'QUESTION',
    page: 0,
    keyword: '',
    sortBy: 'latest',
  });
});

it('검색어를 치면 그 조건으로 다시 부른다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());

  await 검색한다('사료');

  await waitFor(() => expect(마지막조건()).toMatchObject({ keyword: '사료', page: 0 }));
});

it('검색어를 지우면 조건 없이 다시 부른다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());
  await 검색한다('사료');
  await waitFor(() => expect(마지막조건()).toMatchObject({ keyword: '사료' }));

  await fireEvent.press(screen.getByLabelText('입력 내용 지우기'));

  await waitFor(() => expect(마지막조건()).toMatchObject({ keyword: '' }));
});

it('정렬을 고르면 그 값으로 다시 부른다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  await fireEvent.press(screen.getByTestId('community-sort-views'));

  await waitFor(() => expect(마지막조건()).toMatchObject({ sortBy: 'views', page: 0 }));
});

it('정렬만 바꿀 때는 검색어가 남는다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());
  await 검색한다('사료');
  await waitFor(() => expect(마지막조건()).toMatchObject({ keyword: '사료' }));
  await 목록이나오면();

  await fireEvent.press(screen.getByTestId('community-sort-comments'));

  await waitFor(() =>
    expect(마지막조건()).toMatchObject({ keyword: '사료', sortBy: 'comments' })
  );
});

it('탭을 바꾸면 **검색어·정렬이 풀린다**', async () => {
  // ⚠️ 웹이 그렇다 — 탭 전환만 다른 파라미터를 안 이어붙인다(설계 §4).
  //    질문 ↔ 정보는 다른 갈래라 조건을 들고 갈 이유가 없다.
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  await 검색한다('사료');
  await 목록이나오면();
  await fireEvent.press(screen.getByTestId('community-sort-views'));
  await waitFor(() => expect(마지막조건()).toMatchObject({ keyword: '사료', sortBy: 'views' }));

  await fireEvent.press(screen.getByRole('button', { name: '정보 공유' }));

  await waitFor(() =>
    expect(마지막조건()).toEqual({
      boardType: 'INFO',
      page: 0,
      keyword: '',
      sortBy: 'latest',
    })
  );
});

it('탭을 바꾸면 검색칸도 비워진다', async () => {
  // 칸에 옛 글자가 남으면 「지웠는데 그대로」로 보인다.
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());
  await 검색한다('사료');

  await fireEvent.press(screen.getByRole('button', { name: '정보 공유' }));

  await waitFor(() => expect(screen.getByTestId(SEARCH_INPUT).props.value).toBe(''));
});

// ----- 빈 화면 -----
//
// ⚠️ 웹에는 「검색 결과가 없습니다」가 없다 — 검색해도 「첫 번째 이야기를 나눠보세요!」가
//    그대로 뜬다. 검색 결과가 없는데 그 문구는 어색해서 앱에서 갈랐다.

it('검색해서 0건이면 검색 문구를 쓴다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());
  fetchPosts.mockResolvedValue(한페이지([]));

  await 검색한다('없는말');

  await waitFor(() => expect(screen.getByText('검색 결과가 없습니다')).toBeTruthy());
  expect(screen.getByText('다른 검색어로 찾아보세요')).toBeTruthy();
  // 글이 없다는 문구가 새어 나오면 안 된다
  expect(screen.queryByText(/첫 번째 이야기를 나눠보세요/)).toBeNull();
});

it('조건 없이 0건이면 원래 문구를 쓴다', async () => {
  fetchPosts.mockResolvedValue(한페이지([]));

  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText(/첫 번째 이야기를 나눠보세요/)).toBeTruthy());
  expect(screen.queryByText('검색 결과가 없습니다')).toBeNull();
});

it('목록이 비어도 칩 줄과 검색칸은 보인다', async () => {
  // ⚠️ 둘은 목록 **밖**이라 늘 보여야 한다. 안 보이면 조건을 되돌릴 길이 없어진다.
  fetchPosts.mockResolvedValue(한페이지([]));

  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());

  expect(screen.getByRole('button', { name: '정보 공유' })).toBeTruthy();
  expect(screen.getByTestId(SEARCH_INPUT)).toBeTruthy();
});

it('오류일 때도 칩 줄과 검색칸은 보인다', async () => {
  fetchPosts.mockRejectedValue(new Error('그물이 끊겼어요'));

  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText('다시 시도')).toBeTruthy());
  expect(screen.getByRole('button', { name: '정보 공유' })).toBeTruthy();
  expect(screen.getByTestId(SEARCH_INPUT)).toBeTruthy();
});

// 글을 읽고 돌아오면 그 글의 조회수가 달라져 있다. 목록은 탭 화면이라 다시 안 만들어져서
// 우리가 안 부르면 **옛 숫자가 그대로 남는다**(#932).
it('상세를 보고 돌아오면 목록을 다시 부른다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  // 첫 초점에서는 안 부른다 — 질의가 이미 한 번 불렀다. 여기서 부르면 앱을 열 때마다
  // 요청이 두 번 나간다.
  expect(fetchPosts).toHaveBeenCalledTimes(1);

  await act(async () => {
    mock초점.돌아온다();
  });

  await waitFor(() => expect(fetchPosts).toHaveBeenCalledTimes(2));
});

// ----- 게시판 고르는 줄 (#944 과제 2) -----
//
// 알약에서 **밑줄이 미끄러지는 탭**으로 바꿨다. 홈의 대분류 줄과 같은 조각을 쓴다 —
// 같은 자리에 있는 같은 성격의 줄이 화면마다 다른 모양이면 한 앱으로 안 보인다(설계 §②).
//
// ⚠️ 옛 시험들이 글자로 찾는 것(`getByRole('button', { name: '정보 공유' })`)은 **그대로 둔다.**
//    탭도 같은 역할·같은 글자라 그 시험들이 안 깨진다. 그게 「모양만 바뀌었다」의 증거다.

it('게시판을 밑줄 탭으로 그린다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  expect(screen.getByTestId('board-tab-row')).toBeTruthy();
  expect(screen.getByTestId('board-tab-QUESTION')).toBeTruthy();
  expect(screen.getByTestId('board-tab-INFO')).toBeTruthy();
});

it('게시판에는 「전체」 탭이 없다', async () => {
  // 질문이거나 정보 공유거나 둘 중 하나다 — 「조건 없음」이 없다.
  // 그래서 UnderlineTabs 에 allLabel 을 안 준다(홈에는 준다).
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  expect(screen.queryByTestId('board-tab-ALL')).toBeNull();
});

it('탭을 누르면 그 게시판으로 다시 부른다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  await fireEvent.press(screen.getByTestId('board-tab-INFO'));

  await waitFor(() => expect(마지막조건()).toMatchObject({ boardType: 'INFO' }));
});
