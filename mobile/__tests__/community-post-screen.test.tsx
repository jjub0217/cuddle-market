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

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

// 서버로 보내는 것만 가로챈다. 본문 만들기·글자 세기는 진짜 것을 쓴다 —
// 그것까지 흉내 내면 「사진 몫을 뺀 값인가」를 이 시험이 못 지킨다.
jest.mock('@/lib/community-post', () => ({
  ...jest.requireActual('@/lib/community-post'),
  createPost: jest.fn(),
}));

// 사진첩 열기·줄이기·올리기는 기기 일이라 흉내 낸다. 격자 그리기는 진짜 조각이 한다.
jest.mock('@/lib/product-images', () => ({
  ...jest.requireActual('@/lib/product-images'),
  pickImages: jest.fn(),
  shrinkImage: jest.fn(),
  uploadOne: jest.fn(),
}));

const { createPost } = jest.requireMock('@/lib/community-post') as { createPost: jest.Mock };
const { pickImages, shrinkImage, uploadOne } = jest.requireMock('@/lib/product-images') as {
  pickImages: jest.Mock;
  shrinkImage: jest.Mock;
  uploadOne: jest.Mock;
};

beforeEach(() => {
  createPost.mockReset();
  createPost.mockResolvedValue(undefined);
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
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
