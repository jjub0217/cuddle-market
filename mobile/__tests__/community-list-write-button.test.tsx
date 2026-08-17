import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import CommunityListScreen from '@/app/(tabs)/(community)/index';
import { useAuthStore } from '@/lib/auth/store';

// 커뮤니티 목록에 떠 있는 「글쓰기」 단추.
//
// 웹 모바일과 같은 자리(오른쪽 아래)·같은 문구다(CommunityPage.tsx:374).
//
// ⚠️ **게스트에게는 아예 안 그린다.** 웹도 `isLogin()` 일 때만 그리고(CommunityPage.tsx:365),
//    홈 탭의 「상품 등록」도 같다. 누르고 나서 로그인하라는 말을 듣는 것보다 아예 안 보이는
//    편이 낫고, 같은 모양의 뜬 단추가 화면마다 다르게 굴면 앱이 어긋나 보인다.
//
// ⚠️ 목록 화면은 조회를 하므로 서버 부르기를 흉내 낸다 — 이웃 시험
//    (community-list-screen.test.tsx)과 같은 방식이다.

jest.mock('@/lib/community', () => ({
  ...jest.requireActual('@/lib/community'),
  fetchPosts: jest.fn(),
}));

// ⚠️ 이름이 `mock` 으로 시작해야 한다. 아니면 jest 가 「밖의 변수를 봤다」며 막는다.
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

const { fetchPosts } = jest.requireMock('@/lib/community') as { fetchPosts: jest.Mock };

function 한페이지() {
  return {
    hasNext: false,
    content: [
      {
        id: 1,
        title: '강아지 사료 추천',
        contentPreview: '',
        thumbnailImageUrl: null,
        authorNickname: '협주',
        viewCount: 0,
        commentCount: 0,
        createdAt: '2026-08-01T10:00:00',
        updatedAt: '2026-08-01T10:00:00',
        isModified: false,
      },
    ],
  };
}

/** 시험마다 새 클라이언트를 준다 — 앞 시험이 받아 둔 것을 물려받으면 안 된다. */
function 감싸기({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** 마지막으로 서버에 넘긴 조건. */
function 마지막조건() {
  return fetchPosts.mock.calls.at(-1)?.[0];
}

beforeEach(() => {
  mockPush.mockReset();
  fetchPosts.mockReset();
  fetchPosts.mockResolvedValue(한페이지());
  useAuthStore.setState({ status: 'authed' });
});

afterEach(() => {
  // 다음 시험이 앞 시험의 로그인 상태를 물려받으면 안 된다. 처음 값으로 되돌린다.
  useAuthStore.setState({ status: 'restoring' });
});

it('로그인했으면 글쓰기 단추가 있다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  expect(screen.getByRole('button', { name: '글쓰기' })).toBeTruthy();
});

it('누르면 글쓰기 화면으로 간다', async () => {
  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  await fireEvent.press(screen.getByRole('button', { name: '글쓰기' }));

  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/community-post',
    params: { boardType: 'QUESTION' },
  });
});

it('지금 보고 있는 게시판을 들고 간다', async () => {
  // ⚠️ 웹이 `?tab=` 으로 하는 것과 같다. 안 들고 가면 정보 공유를 보다가 글을 써도
  //    질문 게시판에 올라간다.
  await render(<CommunityListScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchPosts).toHaveBeenCalled());

  await fireEvent.press(screen.getByRole('button', { name: '정보 공유' }));
  await waitFor(() => expect(마지막조건()).toMatchObject({ boardType: 'INFO' }));
  await fireEvent.press(screen.getByRole('button', { name: '글쓰기' }));

  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/community-post',
    params: { boardType: 'INFO' },
  });
});

it('게스트에게는 단추를 안 그린다', async () => {
  useAuthStore.setState({ status: 'guest' });

  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  expect(screen.queryByRole('button', { name: '글쓰기' })).toBeNull();
});

it('토큰을 아직 읽는 중이면 안 그린다', async () => {
  // 잠깐 나타났다 사라지면 눌러 놓고 아무 일도 안 일어난 것처럼 보인다.
  useAuthStore.setState({ status: 'restoring' });

  await render(<CommunityListScreen />, { wrapper: 감싸기 });

  expect(screen.queryByRole('button', { name: '글쓰기' })).toBeNull();
});
