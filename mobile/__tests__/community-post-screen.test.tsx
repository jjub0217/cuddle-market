import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CommunityPostScreen from '@/app/community-post';

// 커뮤니티 글쓰기 **화면**의 시험.
//
// ⚠️ 이 시험 파일은 **app/ 밖에** 둔다. expo-router 가 app/ 안의 모든 파일을 화면으로
//    보기 때문에, 거기 두면 실기기가 아예 안 뜬다(mobile/AGENTS.md).
//
// ⚠️ render·fireEvent 는 둘 다 기다려야 한다(RNTL 14). 안 기다리면 오류 없이 옛 값을 준다.
//
// 여기서 지키는 것은 **화면에만 있는 판단**이다 —
//   ① 웹과 같은 문구의 칸이 있는가          (CommunityPostForm.tsx 에서 그대로 가져왔다)
//   ② 짧은 글을 서버로 보내지 않고 막는가    (서버 한계는 제목·본문 둘 다 2자)
//   ③ 글자 수를 **서버가 세는 것과 같은 값**으로 보여주는가
// 본문 만들기·사진 격자는 각자 시험이 있다(lib/community-post.test.ts · post-image-field.test.tsx).

// 화면인자는 시험마다 갈아 끼운다. 기본은 새 글(빈 객체)이다.
//
// ⚠️ 이름을 `mock` 으로 시작하게 두었다. jest 가 `jest.mock` 을 파일 맨 위로 끌어올리는데,
//    그때 밖의 변수를 쓰면 babel-plugin-jest-hoist 가 막는다 — `mock` 으로 시작하는 이름만
//    빠져나갈 수 있다. (계획서에는 `화면인자` 로 적혀 있으나 그대로 두면 파일이 아예 안 돈다)
let mock화면인자: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => mock화면인자,
}));

// 서버로 보내는 것만 가로챈다. 본문 만들기·글자 세기는 진짜 것을 쓴다 —
// 그것까지 흉내 내면 「사진 몫을 뺀 값인가」를 이 시험이 못 지킨다.
jest.mock('@/lib/community-post', () => ({
  ...jest.requireActual('@/lib/community-post'),
  createPost: jest.fn(),
  updatePost: jest.fn(),
}));

// 원래 글을 받아 오는 것만 흉내 낸다. splitContent 는 진짜 것을 써야
// 「사진이 칸으로 올라오는가」를 이 시험이 지킬 수 있다.
jest.mock('@/lib/community', () => ({
  ...jest.requireActual('@/lib/community'),
  fetchPostDetail: jest.fn(),
}));

// 사진첩 열기·줄이기·올리기는 기기 일이라 흉내 낸다. 격자 그리기는 진짜 조각이 한다.
jest.mock('@/lib/product-images', () => ({
  ...jest.requireActual('@/lib/product-images'),
  pickImages: jest.fn(),
  shrinkImage: jest.fn(),
  uploadOne: jest.fn(),
}));

const { createPost, updatePost } = jest.requireMock('@/lib/community-post') as {
  createPost: jest.Mock;
  updatePost: jest.Mock;
};
const { fetchPostDetail } = jest.requireMock('@/lib/community') as { fetchPostDetail: jest.Mock };
const { pickImages, shrinkImage, uploadOne } = jest.requireMock('@/lib/product-images') as {
  pickImages: jest.Mock;
  shrinkImage: jest.Mock;
  uploadOne: jest.Mock;
};

beforeEach(() => {
  // ⚠️ 화면인자를 되돌린다. 안 되돌리면 **앞 시험의 수정 모드가 다음 시험까지 이어져**
  //    새 글 시험이 조용히 틀린 것을 통과시킨다.
  mock화면인자 = {};
  createPost.mockReset();
  createPost.mockResolvedValue(undefined);
  updatePost.mockReset();
  updatePost.mockResolvedValue(undefined);
  fetchPostDetail.mockReset();
  pickImages.mockReset();
  shrinkImage.mockReset();
  uploadOne.mockReset();
});

/**
 * ⚠️ `SafeAreaProvider` 로 감싼다. 안 감싸면 「No safe area value available」로 죽는다
 *    (bottom-sheet.test.tsx·photo-viewer.test.tsx 의 Wrapper 를 그대로 본떴다).
 */
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
function 감싸기({ children }: { children: ReactNode }) {
  // ⚠️ QueryClientProvider 도 필요하다 — 등록 뒤 목록을 무르게 하려고 useQueryClient 를 쓴다(#922).
  //    시험마다 새 client 를 만든다. 나눠 쓰면 앞 시험이 담아 둔 값이 다음 시험에 남는다.
  // ⚠️ `gcTime: Infinity` 를 준다. 기본값(5분)이면 조회가 끝나고 화면이 걷힌 뒤에도
  //    「5분 뒤에 버린다」 타이머가 남아 **jest 가 안 끝난다** — 시험은 다 초록인데
  //    명령이 5분을 매달려 있다가 죽는다. Infinity 면 타이머를 아예 안 건다
  //    (react-query 의 isValidTimeout 이 Infinity 를 거른다).
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider initialMetrics={METRICS}>{children}</SafeAreaProvider>
    </QueryClientProvider>
  );
}

const 제목칸 = () => screen.getByPlaceholderText('제목을 입력해 주세요');
const 본문칸 = () => screen.getByPlaceholderText('내용을 입력하세요');
const 등록단추 = () => screen.getByRole('button', { name: '등록' });

it('제목·본문·사진 칸이 있다', async () => {
  await render(<CommunityPostScreen />, { wrapper: 감싸기 });

  expect(제목칸()).toBeTruthy();
  expect(본문칸()).toBeTruthy();
  expect(screen.getByText('사진 (0/5)')).toBeTruthy();
});

it('게시판 칩은 목록과 같은 둘이다', async () => {
  // 목록 화면(BOARD_CHIPS)과 같은 말을 쓴다 — 같은 갈래를 두 이름으로 부르면 안 된다.
  await render(<CommunityPostScreen />, { wrapper: 감싸기 });

  expect(screen.getByRole('button', { name: '질문 있어요' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '정보 공유' })).toBeTruthy();
});

it('제목이 짧으면 등록을 못 누른다', async () => {
  await render(<CommunityPostScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(제목칸(), 'ㄱ');
  await fireEvent.changeText(본문칸(), '내용입니다');

  expect(등록단추().props.accessibilityState.disabled).toBe(true);
});

it('제목과 본문이 다 차면 등록을 누를 수 있다', async () => {
  await render(<CommunityPostScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(제목칸(), '캣타워 질문');
  await fireEvent.changeText(본문칸(), '상태가 궁금해요');

  expect(등록단추().props.accessibilityState.disabled).toBe(false);
});

// 웹과 같은 모양(n/1000자)을 쓰되 **사진 몫까지 더한 값**을 보여준다.
// 서버가 세는 것과 같은 숫자라야 「999자인데 왜 안 되지」가 안 생긴다.
it('쓴 글자 수를 웹과 같은 모양으로 보여준다', async () => {
  await render(<CommunityPostScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(본문칸(), '12345');

  expect(screen.getByText('5/1000자')).toBeTruthy();
});

it('제목 글자 수도 웹과 같은 모양으로 보여준다', async () => {
  await render(<CommunityPostScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(제목칸(), '캣타워');

  expect(screen.getByText('3/50')).toBeTruthy();
});

it('고른 게시판으로 보낸다', async () => {
  await render(<CommunityPostScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(제목칸(), '캣타워 질문');
  await fireEvent.changeText(본문칸(), '상태가 궁금해요');
  await fireEvent.press(screen.getByRole('button', { name: '정보 공유' }));
  await fireEvent.press(등록단추());

  await waitFor(() =>
    expect(createPost).toHaveBeenCalledWith({
      title: '캣타워 질문',
      body: '상태가 궁금해요',
      imageUrls: [],
      boardType: 'INFO',
    })
  );
});

// ⚠️ 설계의 함정. 미리보기가 먼저 떠서 **다 된 것처럼 보이는데** 주소가 아직 없다.
//    이때 보내면 본문에 `![](null)` 이 들어간다. 막되, **왜 막혔는지 알려야 한다** —
//    단추만 흐려 두면 사진이 다 보이는 화면에서 이유를 알 길이 없다.
it('사진이 다 안 올라갔으면 등록을 막고 이유를 알린다', async () => {
  pickImages.mockResolvedValue([{ uri: 'file://a.jpg' }]);
  shrinkImage.mockResolvedValue('file://a-small.jpg');
  let 올리기끝 = (_url: string) => {};
  uploadOne.mockReturnValue(
    new Promise<string>((resolve) => {
      올리기끝 = resolve;
    })
  );

  await render(<CommunityPostScreen />, { wrapper: 감싸기 });
  await fireEvent.changeText(제목칸(), '캣타워 질문');
  await fireEvent.changeText(본문칸(), '상태가 궁금해요');
  await fireEvent.press(screen.getByTestId('post-image-add'));

  await waitFor(() => expect(screen.getByTestId('post-image-0')).toBeTruthy());
  expect(등록단추().props.accessibilityState.disabled).toBe(true);
  expect(screen.getByText(/사진을 올리는 중이에요/)).toBeTruthy();

  await act(async () => {
    올리기끝('https://cdn/a.webp');
  });

  await waitFor(() => expect(등록단추().props.accessibilityState.disabled).toBe(false));
  expect(screen.queryByText(/사진을 올리는 중이에요/)).toBeNull();
});

it('올라간 사진 주소를 함께 보낸다', async () => {
  pickImages.mockResolvedValue([{ uri: 'file://a.jpg' }]);
  shrinkImage.mockResolvedValue('file://a-small.jpg');
  uploadOne.mockResolvedValue('https://cdn/a.webp');

  await render(<CommunityPostScreen />, { wrapper: 감싸기 });
  await fireEvent.changeText(제목칸(), '캣타워 질문');
  await fireEvent.changeText(본문칸(), '상태가 궁금해요');
  await fireEvent.press(screen.getByTestId('post-image-add'));
  await waitFor(() => expect(등록단추().props.accessibilityState.disabled).toBe(false));

  await fireEvent.press(등록단추());

  await waitFor(() =>
    expect(createPost).toHaveBeenCalledWith(
      expect.objectContaining({ imageUrls: ['https://cdn/a.webp'] })
    )
  );
});

// 등록하고 목록으로 돌아오면 방금 쓴 글이 보여야 한다(#922).
//
// ⚠️ 무르게 하지 않으면 캐시에 든 옛 목록이 그대로 보여 「등록이 안 됐나」로 읽힌다.
//    실제로 그랬다 — 앱을 다시 불러와야 새 글이 보였다.
//
// ⚠️ **목록이 진짜로 다시 조회하는지는 여기서 못 본다**(목록 화면이 없다).
//    「무르게 하라고 시켰는가」까지만 지킨다. 나머지는 실기기로 봐야 한다.
it('등록하면 목록을 무르게 한다', async () => {
  const 무르게 = jest.spyOn(QueryClient.prototype, 'invalidateQueries');

  await render(<CommunityPostScreen />, { wrapper: 감싸기 });
  await fireEvent.changeText(제목칸(), '캣타워 질문');
  await fireEvent.changeText(본문칸(), '상태가 궁금해요');
  await fireEvent.press(등록단추());

  await waitFor(() => {
    expect(무르게).toHaveBeenCalledWith({ queryKey: ['communityPosts'] });
  });
  무르게.mockRestore();
});

/**
 * 수정 모드로 만든다. **사진 한 장이 본문 안에 들어 있는 글**이다.
 *
 * ⚠️ 서버는 사진을 따로 안 준다 — `imageUrls` 가 비어 있고 사진은 본문 마크다운 안에만
 *    있다(실제 응답으로 확인했다). 이 모양이라야 「본문에서 꺼내 사진 칸에 올리는가」를
 *    시험이 지킬 수 있다.
 */
function 수정모드로(덮어쓰기: Record<string, unknown> = {}) {
  mock화면인자 = { postId: '39' };
  fetchPostDetail.mockResolvedValue({
    id: 39,
    authorId: 7,
    authorNickname: '나',
    authorProfileImageUrl: null,
    title: '캣타워 질문',
    content: '상태가 궁금해요\n\n![](https://cdn/a.webp)',
    imageUrls: [],
    boardType: 'QUESTION',
    viewCount: 0,
    commentCount: 0,
    createdAt: '2026-08-17T00:00:00',
    ...덮어쓰기,
  });
}

describe('수정 모드', () => {
  it('수정 모드면 헤더가 「게시글 수정」이다', async () => {
    수정모드로();
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });

    await waitFor(() => expect(screen.getByText('게시글 수정')).toBeTruthy());
  });

  it('원래 제목과 본문이 채워져 있다', async () => {
    수정모드로();
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });

    await waitFor(() => expect(제목칸().props.value).toBe('캣타워 질문'));
    expect(본문칸().props.value).toBe('상태가 궁금해요');
  });

  // ⭐ 이 과제의 알맹이 — 본문에 있던 사진이 사진 칸으로 올라온다.
  //    서버가 사진을 따로 안 주므로 splitContent 로 꺼내야 여기가 채워진다.
  it('본문에 있던 사진이 사진 칸에 들어간다', async () => {
    수정모드로();
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });

    await waitFor(() => expect(screen.getByText('사진 (1/5)')).toBeTruthy());
  });

  // 꺼낸 사진은 **이미 올라간 것**이다. 다시 올릴 것이 없으니 바로 저장할 수 있어야 한다 —
  // url 을 안 채우면 「사진을 올리는 중이에요」에 걸려 영영 못 누른다.
  it('꺼낸 사진을 그대로 다시 보낸다', async () => {
    수정모드로();
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });
    await waitFor(() => expect(제목칸().props.value).toBe('캣타워 질문'));

    await fireEvent.press(등록단추());

    await waitFor(() =>
      expect(updatePost).toHaveBeenCalledWith(
        39,
        expect.objectContaining({ imageUrls: ['https://cdn/a.webp'] })
      )
    );
  });

  it('원래 게시판이 골라져 있다', async () => {
    // ⚠️ 안 채우면 「정보 공유」 글을 고칠 때 조용히 질문 게시판으로 옮겨간다.
    수정모드로({ boardType: 'INFO' });
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });
    await waitFor(() => expect(제목칸().props.value).toBe('캣타워 질문'));

    await fireEvent.press(등록단추());

    await waitFor(() =>
      expect(updatePost).toHaveBeenCalledWith(39, expect.objectContaining({ boardType: 'INFO' }))
    );
  });

  it('저장하면 updatePost 를 부른다 (createPost 가 아니라)', async () => {
    수정모드로();
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });
    await waitFor(() => expect(제목칸().props.value).toBe('캣타워 질문'));

    await fireEvent.press(등록단추());

    await waitFor(() => expect(updatePost).toHaveBeenCalled());
    expect(createPost).not.toHaveBeenCalled();
  });

  // 받아 온 글은 **한 번만** 붓는다. 매번 부으면 사용자가 고친 것이 되돌아간다.
  it('받아 온 글이 사용자가 고친 것을 덮지 않는다', async () => {
    수정모드로();
    await render(<CommunityPostScreen />, { wrapper: 감싸기 });
    await waitFor(() => expect(제목칸().props.value).toBe('캣타워 질문'));

    await fireEvent.changeText(제목칸(), '캣타워 다시 질문');

    expect(제목칸().props.value).toBe('캣타워 다시 질문');
  });

  // 저장하고 돌아오면 상세도 목록도 바뀐 내용이라야 한다.
  it('저장하면 상세와 목록을 둘 다 무르게 한다', async () => {
    const 무르게 = jest.spyOn(QueryClient.prototype, 'invalidateQueries');
    수정모드로();

    await render(<CommunityPostScreen />, { wrapper: 감싸기 });
    await waitFor(() => expect(제목칸().props.value).toBe('캣타워 질문'));
    await fireEvent.press(등록단추());

    await waitFor(() => {
      expect(무르게).toHaveBeenCalledWith({ queryKey: ['communityPost', 39] });
    });
    expect(무르게).toHaveBeenCalledWith({ queryKey: ['communityPosts'] });
    무르게.mockRestore();
  });
});
