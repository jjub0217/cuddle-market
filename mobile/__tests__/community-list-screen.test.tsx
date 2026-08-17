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

/**
 * 화면 주소에 실린 값. **검색어는 화면 상태가 아니라 주소로 든다**(#944 과제 5) —
 * 검색 화면이 목록으로 돌려보낼 때 주소에 실어 주기 때문이다.
 * 시험은 여기에 검색어를 넣어 「검색 중」 상태를 만든다.
 */
const mock주소값: { keyword?: string } = {};

/**
 * 주소를 바꾸는 길. 화면이 검색을 걸거나 풀 때 부른다.
 *
 * ⚠️ **부르면 실제로 주소값도 바꾼다.** 그래야 그다음 렌더에서 화면이 새 값을 읽는다 —
 *    부른 것만 세고 값을 안 바꾸면 「탭을 바꾸면 검색어가 풀린다」를 증명할 수 없다.
 */
const mock주소바꾸기 = jest.fn((next: { keyword?: string }) => {
  Object.assign(mock주소값, next);
});

const mock화면이동 = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mock화면이동, setParams: mock주소바꾸기, replace: jest.fn() }),
  useLocalSearchParams: () => mock주소값,
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

/**
 * 「검색 중」 상태로 시작한다.
 *
 * ⚠️ **그리기 전에 불러야 한다.** 검색어는 주소에 실려 오는데, 이미 그려진 뒤에 값을
 *    바꿔도 화면이 다시 그려지지 않는다. 예전에는 화면 안 검색칸에 글자를 쳤지만
 *    그 칸은 헤더 돋보기 → 검색 화면으로 옮겨 갔다(#944 과제 5).
 */
function 검색중으로(글자: string) {
  mock주소값.keyword = 글자;
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
  delete mock주소값.keyword;
  mock주소바꾸기.mockClear();
  mock화면이동.mockClear();
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

it('주소에 검색어가 있으면 그 조건으로 부른다', async () => {
  // 검색 화면이 목록으로 돌려보내며 주소에 검색어를 싣는다(app/community-search.tsx).
  검색중으로('사료');

  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(마지막조건()).toMatchObject({ keyword: '사료', page: 0 }));
});

it('검색 줄에서 뒤로 누르면 검색이 풀린다', async () => {
  // 화면을 닫는 게 아니라 **조건만** 없앤다 — 목록은 그 자리에 그대로 있다.
  검색중으로('사료');

  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  await fireEvent.press(screen.getByLabelText('뒤로'));

  expect(mock주소바꾸기).toHaveBeenCalledWith({ keyword: '' });
});

it('정렬을 고르면 그 값으로 다시 부른다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  await fireEvent.press(screen.getByTestId('community-sort-views'));

  await waitFor(() => expect(마지막조건()).toMatchObject({ sortBy: 'views', page: 0 }));
});

it('정렬만 바꿀 때는 검색어가 남는다', async () => {
  검색중으로('사료');

  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  await fireEvent.press(screen.getByTestId('community-sort-comments'));

  await waitFor(() =>
    expect(마지막조건()).toMatchObject({ keyword: '사료', sortBy: 'comments' })
  );
});

it('탭을 바꾸면 **검색어·정렬이 풀린다**', async () => {
  // ⚠️ 웹이 그렇다 — 탭 전환만 다른 파라미터를 안 이어붙인다(설계 §4).
  //    질문 ↔ 정보는 다른 갈래라 조건을 들고 갈 이유가 없다.
  검색중으로('사료');

  await render(<CommunityListScreen />, { wrapper: 감싸기 });
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

it('탭을 바꾸면 헤더가 평소 모습으로 돌아온다', async () => {
  // 검색이 풀리면 검색 줄도 사라져야 한다. 옛 검색어가 남아 있으면
  // 「지웠는데 그대로」로 보인다.
  검색중으로('사료');

  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  await fireEvent.press(screen.getByRole('button', { name: '정보 공유' }));

  await waitFor(() => expect(screen.getByText('커뮤니티')).toBeTruthy());
});

// ----- 빈 화면 -----
//
// ⚠️ 웹에는 「검색 결과가 없습니다」가 없다 — 검색해도 「첫 번째 이야기를 나눠보세요!」가
//    그대로 뜬다. 검색 결과가 없는데 그 문구는 어색해서 앱에서 갈랐다.

it('검색해서 0건이면 검색 문구를 쓴다', async () => {
  검색중으로('없는말');
  fetchPosts.mockResolvedValue(한페이지([]));

  await render(<CommunityListScreen />, { wrapper: 감싸기 });

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

it('목록이 비어도 탭 줄과 돋보기는 보인다', async () => {
  // ⚠️ 둘은 목록 **밖**이라 늘 보여야 한다. 안 보이면 조건을 되돌릴 길이 없어진다.
  fetchPosts.mockResolvedValue(한페이지([]));

  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());

  expect(screen.getByRole('button', { name: '정보 공유' })).toBeTruthy();
  expect(screen.getByLabelText('검색')).toBeTruthy();
});

it('오류일 때도 탭 줄과 돋보기는 보인다', async () => {
  fetchPosts.mockRejectedValue(new Error('그물이 끊겼어요'));

  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText('다시 시도')).toBeTruthy());
  expect(screen.getByRole('button', { name: '정보 공유' })).toBeTruthy();
  expect(screen.getByLabelText('검색')).toBeTruthy();
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

// ----- 정렬 줄의 자리 (#944 과제 3) -----
//
// 목록의 헤더(ListHeaderComponent)에서 **목록 밖 형제**로 옮겼다.
//
// ⚠️ **붙는 줄(sticky)로 만들지 않았다.** 정렬 줄은 목록 안에서 맨 처음이라 붙여 두는 것과
//    목록 밖에 두는 것이 **눈에는 똑같은데**, 붙는 줄로 만들면 #935 에서 잡은 고장
//    (붙은 줄 안 누름판의 onPress 가 버려지는 RN 회귀)을 복제하게 된다(설계 §④).
//
// 목록 밖으로 나오면 **덤이 하나 있다** — 목록이 비거나 오류일 때도 정렬 줄이 남는다.
// 예전에는 그때 통째로 사라져 조건을 되돌릴 길이 화면에서 없어졌다.

it('목록이 비어도 정렬 줄이 남는다', async () => {
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

// ----- 헤더와 검색 (#944 과제 4·5) -----
//
// 검색이 **목록 위 칸에서 헤더 돋보기 → 검색 화면**으로 옮겨 갔다.
// 검색 결과는 별도 화면이 아니라 **이 목록 화면 그대로**에 그린다 — 상품의 결과 화면은
// 탭 밖이라 하단 탭바가 사라지는데, 커뮤니티는 「보다가 찾는」 흐름이고 검색 중에도
// 게시판 탭이 보여야 하기 때문이다(설계 §③).

it('평소에는 제목과 돋보기가 있는 헤더다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  expect(screen.getByText('커뮤니티')).toBeTruthy();
  expect(screen.getByLabelText('검색')).toBeTruthy();
});

it('돋보기를 누르면 검색 화면으로 간다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  await fireEvent.press(screen.getByLabelText('검색'));

  expect(mock화면이동).toHaveBeenCalledWith('/community-search');
});

it('검색 중에는 헤더가 검색 줄로 바뀌고 탭·정렬 줄은 그대로다', async () => {
  // ⚠️ **여기가 상품과 다른 점이다.** 상품은 결과를 별도 화면에 그려 탭바가 사라진다.
  //    커뮤니티는 목록 화면 그대로라 게시판 탭도 정렬 줄도 계속 보여야 한다.
  검색중으로('사료');

  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await 목록이나오면();

  // 평소 헤더의 제목은 사라진다
  expect(screen.queryByText('커뮤니티')).toBeNull();
  // 그런데 아래 두 줄은 그대로 있다
  expect(screen.getByTestId('board-tab-row')).toBeTruthy();
  expect(screen.getByTestId('community-sort-latest')).toBeTruthy();
});
