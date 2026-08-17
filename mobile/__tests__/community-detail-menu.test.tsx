import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import PostDetailScreen from '@/app/(tabs)/(community)/posts/[id]';

// 게시글 상세의 헤더 ⋮ 메뉴 시험.
//
// 내 글에는 수정·삭제, 남의 글에는 신고.
//
// ⚠️ 지금까지는 내 글에 ⋮ 가 아예 없었다(「나를 신고할 이유가 없다」).
//    이제 내 글에도 뜬다 — 할 수 있는 일이 생겼기 때문이다.
//
// ⚠️ 이 시험 파일은 **app/ 밖에** 둔다. expo-router 는 app/ 안의 모든 파일을 화면으로
//    보기 때문에, 거기 두면 실기기가 아예 안 뜬다(mobile/AGENTS.md).
//
// ⚠️ render·fireEvent 는 둘 다 기다려야 한다(RNTL 14). 안 기다리면 오류 없이 옛 값을 준다.

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

// 내 글인지 아닌지를 이 값으로 가른다(화면이 me.id === post.authorId 로 본다).
jest.mock('@/hooks/use-me', () => ({ useMe: jest.fn() }));

jest.mock('@/lib/community', () => ({
  ...jest.requireActual('@/lib/community'),
  fetchPostDetail: jest.fn(),
  fetchComments: jest.fn(),
}));

jest.mock('@/lib/community-post', () => ({
  ...jest.requireActual('@/lib/community-post'),
  deletePost: jest.fn(),
}));

jest.mock('@/lib/toast', () => ({
  ...jest.requireActual('@/lib/toast'),
  showToast: jest.fn(),
}));

const { useRouter, useLocalSearchParams } = jest.requireMock('expo-router') as {
  useRouter: jest.Mock;
  useLocalSearchParams: jest.Mock;
};
const { useMe } = jest.requireMock('@/hooks/use-me') as { useMe: jest.Mock };
const { fetchPostDetail, fetchComments } = jest.requireMock('@/lib/community') as {
  fetchPostDetail: jest.Mock;
  fetchComments: jest.Mock;
};
const { deletePost } = jest.requireMock('@/lib/community-post') as { deletePost: jest.Mock };
const { showToast } = jest.requireMock('@/lib/toast') as { showToast: jest.Mock };

const push = jest.fn();
const back = jest.fn();

beforeEach(() => {
  push.mockReset();
  back.mockReset();
  deletePost.mockReset();
  deletePost.mockResolvedValue(undefined);
  showToast.mockReset();

  useRouter.mockReturnValue({ push, back });
  useLocalSearchParams.mockReturnValue({ id: '39' });
  // 내 id. 글쓴이(authorId: 7)와 같으면 내 글이다.
  useMe.mockReturnValue({ data: { id: 7 } });

  fetchComments.mockResolvedValue([]);
  fetchPostDetail.mockResolvedValue({
    id: 39,
    authorId: 7,
    authorNickname: '나',
    authorProfileImageUrl: null,
    title: '캣타워 질문',
    content: '상태가 궁금해요',
    imageUrls: [],
    viewCount: 0,
    commentCount: 0,
    boardType: 'QUESTION',
    // ⚠️ 계획서 흉내 코드에 없던 값이다. 화면이 getTimeAgo(post.createdAt) 을 부르는데
    //    없으면 그 자리에서 죽는다(정규식이 undefined 를 받는다).
    createdAt: '2026-08-17T00:00:00',
  });
});

/** 남의 글로 만든다 */
function 남의글로() {
  useMe.mockReturnValue({ data: { id: 99 } });
}

/**
 * ⚠️ `SafeAreaProvider` 로 감싼다. 안 감싸면 「No safe area value available」로 죽는다
 *    (bottom-sheet.test.tsx·photo-viewer.test.tsx 의 Wrapper 를 그대로 본떴다).
 */
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/**
 * 시험마다 새 클라이언트를 준다 — 앞 시험이 받아 둔 것을 물려받으면 안 된다.
 *
 * ⚠️ **`gcTime: Infinity` 를 준다.** 기본값(5분)이면 「5분 뒤에 버린다」 타이머가 남아
 *    시험이 다 초록인데도 **jest 가 안 끝난다**(「Jest did not exit one second after…」).
 *    무한이면 타이머를 아예 안 건다.
 */
function 감싸기({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

/** 화면을 그리고 헤더 ⋮ 를 연다 */
async function 메뉴를연다() {
  await render(<PostDetailScreen />, { wrapper: 감싸기 });
  await fireEvent.press(await screen.findByLabelText('더보기'));
}

it('내 글이면 수정·삭제가 보인다', async () => {
  await 메뉴를연다();

  expect(screen.getByText('게시글 수정')).toBeTruthy();
  expect(screen.getByText('게시글 삭제')).toBeTruthy();
  // 내 글을 나에게 신고하게 두면 안 된다
  expect(screen.queryByText('게시글 신고하기')).toBeNull();
});

it('남의 글이면 신고만 보인다', async () => {
  남의글로();

  await 메뉴를연다();

  expect(screen.getByText('게시글 신고하기')).toBeTruthy();
  expect(screen.queryByText('게시글 삭제')).toBeNull();
  expect(screen.queryByText('게시글 수정')).toBeNull();
});

it('수정을 누르면 글쓰기 화면에 postId 를 들고 간다', async () => {
  // 수정 화면을 따로 안 만들었다 — 글쓰기 화면이 postId 를 받으면 수정 모드가 된다.
  await 메뉴를연다();

  await fireEvent.press(screen.getByText('게시글 수정'));

  expect(push).toHaveBeenCalledWith({
    pathname: '/community-post',
    params: { postId: '39' },
  });
});

it('삭제를 누르면 확인창을 거친다', async () => {
  // 되돌릴 수 없는 일이라 한 번에 지우지 않는다.
  await 메뉴를연다();

  await fireEvent.press(screen.getByText('게시글 삭제'));

  // 문구는 웹 DeletePostConfirmModal 그대로다
  expect(screen.getByText('정말로 이 게시글을 삭제하시겠습니까?')).toBeTruthy();
  expect(screen.getByRole('button', { name: '삭제하기' })).toBeTruthy();
  expect(deletePost).not.toHaveBeenCalled();
});

it('확인창에서 삭제하면 지우고 목록을 무르게 한 뒤 돌아간다', async () => {
  // ⚠️ 무르게 하지 않으면 캐시에 든 옛 목록에 지운 글이 그대로 남는다(#922 와 같은 일).
  const 무르게 = jest.spyOn(QueryClient.prototype, 'invalidateQueries');
  await 메뉴를연다();
  await fireEvent.press(screen.getByText('게시글 삭제'));

  await fireEvent.press(screen.getByRole('button', { name: '삭제하기' }));

  await waitFor(() => expect(deletePost).toHaveBeenCalledWith(39));
  expect(무르게).toHaveBeenCalledWith({ queryKey: ['communityPosts'] });
  // 댓글 삭제와 같은 말투다(comment-menu-sheet.tsx 의 「댓글을 삭제했습니다」)
  expect(showToast).toHaveBeenCalledWith('게시글을 삭제했습니다');
  expect(back).toHaveBeenCalled();
  무르게.mockRestore();
});

it('지우지 못하면 창을 닫지 않고 까닭을 알린다', async () => {
  // ⚠️ 창이 닫히면 다시 시도할 길이 없다. ConfirmDialog 는 스스로 안 닫으므로
  //    화면이 「닫으라」고 하지 않기만 하면 열려 있다.
  deletePost.mockRejectedValue(new Error('내 글이 아니에요'));
  await 메뉴를연다();
  await fireEvent.press(screen.getByText('게시글 삭제'));

  await fireEvent.press(screen.getByRole('button', { name: '삭제하기' }));

  await waitFor(() => expect(showToast).toHaveBeenCalledWith('내 글이 아니에요'));
  expect(screen.getByText('정말로 이 게시글을 삭제하시겠습니까?')).toBeTruthy();
  expect(back).not.toHaveBeenCalled();
});
