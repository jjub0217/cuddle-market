import { QueryClient } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Keyboard } from 'react-native';

import PostDetailScreen from '@/app/(tabs)/(community)/posts/[id]';
import { createScreenWrapper } from '@/test-utils/query-wrapper';

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

// 안전영역 값과 QueryClient 설정은 mobile/test-utils/query-wrapper.tsx 로 모았다(#1059).
const 감싸기 = createScreenWrapper({ safeArea: true });

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

// #993 — RN 의 <Text> 는 기본이 선택 불가라 꾹 눌러도 복사가 안 된다(#896·#988 과 같은 종류).
// 웹은 HTML 글자라 저절로 되기 때문에 앱만 「고장」으로 보인다.
//
// ⚠️ 이 파일은 이름이 「메뉴」지만 그리는 화면은 게시글 상세 하나다. 상세 화면의
//    시험이 여기 다 모여 있어 새 파일을 만들지 않고 여기에 더한다.
describe('꾹 눌러 복사 (#993)', () => {
  it('제목은 꾹 눌러 고를 수 있다', async () => {
    await render(<PostDetailScreen />, { wrapper: 감싸기 });

    const 제목 = await screen.findByText('캣타워 질문');

    expect(제목.props.selectable).toBe(true);
  });

  // ⚠️ 글쓴이 닉네임은 **누르면 프로필로 가는 Pressable 안**이라 선택을 달면 안 된다 —
  //    꾹 누르면 그 탭이 씹힌다(mobile/AGENTS.md). 실수로 달리는 것을 여기서 막는다.
  it('글쓴이 닉네임에는 안 단다 (누르면 프로필로 가는 자리다)', async () => {
    await render(<PostDetailScreen />, { wrapper: 감싸기 });

    // 아바타의 첫 글자도 같은 「나」다. 둘 다 선택되면 안 된다.
    const 나들 = await screen.findAllByText('나');

    나들.forEach((하나) => expect(하나.props.selectable).toBeFalsy());
  });

  // 프로필로 가는 길은 **사진과 닉네임까지**다. 시간·조회수는 그 밖에 있어야 한다 —
  // 그 자리는 「이 글에 대한 사실」이지 「이 사람」이 아니다. 한 덩어리로 도로 붙는 것을 막는다.
  it('시간·조회수는 프로필로 가는 자리 밖에 있다', async () => {
    await render(<PostDetailScreen />, { wrapper: 감싸기 });
    await screen.findByText('캣타워 질문');

    // 닉네임과 같은 글자 안에 있으면 이 찾기가 실패한다(한 덩어리라는 뜻).
    const 시간줄 = screen.getByText(/조회 /);

    expect(시간줄.props.children).not.toContain('나');
  });

  // 배경 Pressable 은 걷어 냈다(#991). 이제 맨 바깥이 누름을 **잡지 않고 구경만** 한다 —
  // hooks/use-selection-clear.ts 의 누름구경(onTouchStart/onTouchEnd)이다.
  //
  // ⚠️ **실제로 안드로이드의 선택이 풀리는지는 시험이 못 본다** — 네이티브 TextView 가 쥐고
  //    있어 jest 에 없다. 그래서 여기서는 ① 손잡이가 맨 바깥에 달렸는가 ② 키보드를 우리가
  //    건드리지 않는가, 둘만 지킨다. 나머지는 실기기 몫이다(mobile/AGENTS.md).
  it('맨 바깥이 누름을 구경한다 (잡지 않는다)', async () => {
    // ⚠️ onStartShouldSetResponder 로 누름을 **잡으면** 꾹 누르기가 통째로 죽는다.
    //    실기기에서 두 번 겪은 일이라 여기서 막는다.
    await render(<PostDetailScreen />, { wrapper: 감싸기 });
    await screen.findByText('캣타워 질문');

    const 맨바깥 = screen.getByTestId('post-detail-screen');

    expect(typeof 맨바깥.props.onTouchStart).toBe('function');
    expect(typeof 맨바깥.props.onTouchEnd).toBe('function');
    expect(맨바깥.props.onStartShouldSetResponder).toBeUndefined();
  });

  // ⚠️ **키보드는 우리가 내리지 않는다.** 내렸더니 댓글칸을 탭할 때 키보드가 올라오자마자
  //    도로 내려갔다(2026-08-21 실기기). 탭인지 「칸을 누른 것」인지 우리는 못 가른다.
  //    안 내려도 된다 — 누름을 안 뺏으므로 ScrollView 의 keyboardShouldPersistTaps="handled"
  //    가 원래대로 빈 곳 누름을 받아 내린다. 도로 넣는 것을 여기서 막는다.
  it('키보드는 우리가 내리지 않는다 (ScrollView 몫이다)', async () => {
    const 내리기 = jest.spyOn(Keyboard, 'dismiss');
    await render(<PostDetailScreen />, { wrapper: 감싸기 });
    await screen.findByText('캣타워 질문');
    const 맨바깥 = screen.getByTestId('post-detail-screen');

    // 누르고 바로 떼면 300ms 안이라 「탭」이다(use-selection-clear.ts 의 TAP_MS).
    await fireEvent(맨바깥, 'touchStart');
    await fireEvent(맨바깥, 'touchEnd');

    expect(내리기).not.toHaveBeenCalled();
    내리기.mockRestore();
  });
});
