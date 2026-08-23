import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Keyboard } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import ChatRoomScreen from '@/app/chat/[id]';

// 채팅방에서 **고른 글자가 아무 데나 눌러 풀리는가**(#994).
//
// 말풍선은 이미 selectable 이다(#896). 그런데 안드로이드의 글자 선택은 그 글자가 초점을
// 잃을 때만 풀리는데, 보통 View 는 초점을 안 가져가서 빈 곳을 눌러도 선택이 남았다.
// 푸는 규칙은 hooks/use-selection-clear.ts 한 곳에 모여 있다.
//
// ⚠️ **실제로 안드로이드의 선택이 풀리는지는 시험이 못 본다** — 네이티브 TextView 가 쥐고
//    있어 jest 에 없다. 여기서는 ① 손잡이가 맨 바깥에 달렸는가(그리고 누름을 **안 잡는가**)
//    ② 키보드를 우리가 안 건드리는가 ③ 말풍선이 selectable 인가 ④ 탭이 글자 말풍선만
//    갈아 끼우고 **사진 말풍선은 그대로 두는가**, 넷을 지킨다. 나머지는 실기기 몫이다.
//
// ⚠️ 이 시험 파일은 **app/ 밖에** 둔다. expo-router 는 app/ 안의 모든 파일을 화면으로 봐서
//    거기 두면 실기기가 아예 안 뜬다(mobile/AGENTS.md).
//
// ⚠️ render·fireEvent 는 둘 다 기다려야 한다(RNTL 14).

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: '7' }),
}));

jest.mock('@/hooks/use-me', () => ({ useMe: () => ({ data: { id: 1 } }) }));

// ⚠️ 진짜 소켓을 두면 정말 붙으러 간다 — 시험에는 서버 주소 환경값이 없어 죽는다
//    (chat-list-screen.test.tsx 와 같은 이유).
jest.mock('@/lib/chat/socket', () => ({
  chatSocket: {
    acquire: jest.fn(),
    release: jest.fn(),
    subscribe: jest.fn(() => () => {}),
    publish: jest.fn(() => true),
    isConnected: jest.fn(() => true),
  },
}));

// 상품 조회도 막는다. 거래 상태 뱃지가 붙으면서 채팅방이 **열자마자** 상품을 부르게
// 바뀌었다(#1035 의 앱 몫) — 전에는 ⋮ 메뉴를 열 때만 불러서 이 시험에 걸릴 일이 없었다.
//
// ⚠️ **안 막아도 지금은 시험이 통과한다**(재 봤다). 시험에는 `EXPO_PUBLIC_API_BASE_URL` 이
//    없어서 `apiBaseUrl()` 이 먼저 던지고, 그 탈을 react-query 가 삼키기 때문이다 —
//    바깥으로 나가는 요청은 하나도 없었다(`global.fetch` 를 지켜봐서 확인).
//    그래도 막아 두는 것은 **그 환경값이 있는 곳에서는 진짜 서버로 나가기 때문**이다.
//    바로 위 소켓을 막아 둔 것과 같은 까닭이다.
jest.mock('@/lib/products', () => ({
  ...jest.requireActual('@/lib/products'),
  fetchProductDetail: jest.fn(() =>
    Promise.resolve({
      tradeStatus: 'SELLING',
      productType: 'SELL',
      // 파는 사람이 내가 아니어야 「판매완료 처리」가 안 뜬다(내 id 는 1 로 흉내 냈다).
      sellerInfo: { sellerId: 2 },
    })
  ),
}));

jest.mock('@/lib/chat/api', () => ({
  ...jest.requireActual('@/lib/chat/api'),
  fetchChatMessages: jest.fn(),
  pingChatRoomRead: jest.fn(() => Promise.resolve()),
  leaveChatRoom: jest.fn(() => Promise.resolve()),
}));

// 말풍선을 **갈아 끼웠는지**(다시 마운트했는지) 세려고 진짜 조각을 얇게 감싼다.
// 안을 진짜로 두어야 selectable 시험이 같이 산다.
//
// ⚠️ 이름이 `mock` 으로 시작해야 한다 — jest 가 jest.mock 을 맨 위로 끌어올릴 때
//    그 이름만 빠져나간다(mobile/AGENTS.md).
const mock마운트 = { 글자: 0, 사진: 0 };

jest.mock('@/components/chat/message-bubble', () => {
  const 진짜 = jest.requireActual('@/components/chat/message-bubble');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react') as typeof import('react');
  return {
    ...진짜,
    // ⚠️ 여기에 `type Props = …` 를 두면 안 된다. jest 가 jest.mock 을 맨 위로 끌어올릴 때
    //    **타입 이름도 바깥 변수로 보고 막는다**(«Invalid variable access: Props»).
    //    타입을 그 자리에 바로 적는다.
    MessageBubble: (props: { message: { messageType: string } }) => {
      const 사진인가 = props.message.messageType === 'IMAGE';
      React.useEffect(() => {
        if (사진인가) mock마운트.사진 += 1;
        else mock마운트.글자 += 1;
        // 마운트할 때 한 번만 센다.
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return React.createElement(진짜.MessageBubble, props);
    },
  };
});

const { fetchChatMessages } = jest.requireMock('@/lib/chat/api') as {
  fetchChatMessages: jest.Mock;
};

const 글자메시지 = {
  messageId: 11,
  senderId: 2,
  senderNickname: '상대',
  messageType: 'TEXT' as const,
  content: '국민 123-456 로 보내주세요',
  imageUrl: null,
  isBlocked: false,
  blockReason: null,
  createdAt: '2026-08-21T01:00:00',
  isMine: false,
};

const 사진메시지 = {
  ...글자메시지,
  messageId: 12,
  messageType: 'IMAGE' as const,
  content: '',
  imageUrl: 'https://example.com/cat.webp',
  createdAt: '2026-08-21T01:01:00',
};

const 방 = {
  opponentId: 2,
  opponentNickname: '상대',
  opponentProfileImageUrl: null,
  productId: 3,
  productTitle: '캣타워',
  productPrice: 10000,
  productImageUrl: null,
};

/**
 * ⚠️ `SafeAreaProvider` 로 감싼다. 확대창(PhotoViewer)이 안전영역을 써서 안 감싸면
 *    「No safe area value available」로 죽는다.
 * ⚠️ 시험용 `QueryClient` 에 **`gcTime: Infinity`** — 기본값(5분)이면 타이머가 남아
 *    시험이 다 초록인데도 jest 가 안 끝난다(mobile/AGENTS.md).
 */
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

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

beforeEach(() => {
  mock마운트.글자 = 0;
  mock마운트.사진 = 0;
  fetchChatMessages.mockReset();
  fetchChatMessages.mockResolvedValue({
    messages: [글자메시지, 사진메시지],
    hasNext: false,
    isOpponentBlocked: false,
    room: 방,
  });
});

async function 방을그린다() {
  await render(<ChatRoomScreen />, { wrapper: 감싸기 });
  return screen.findByText(글자메시지.content);
}

it('맨 바깥이 누름을 구경한다 (잡지 않는다)', async () => {
  // ⚠️ onStartShouldSetResponder 로 누름을 **잡으면** 꾹 누르기가 통째로 죽는다.
  //    실기기에서 두 번 겪은 일이라 여기서 막는다.
  await 방을그린다();

  const 맨바깥 = screen.getByTestId('chat-room-screen');

  expect(typeof 맨바깥.props.onTouchStart).toBe('function');
  expect(typeof 맨바깥.props.onTouchEnd).toBe('function');
  expect(맨바깥.props.onStartShouldSetResponder).toBeUndefined();
});

it('키보드는 우리가 내리지 않는다', async () => {
  // 내렸더니 입력칸을 탭할 때 키보드가 올라오자마자 도로 내려갔다(2026-08-21 실기기).
  const 내리기 = jest.spyOn(Keyboard, 'dismiss');
  await 방을그린다();
  const 맨바깥 = screen.getByTestId('chat-room-screen');

  await fireEvent(맨바깥, 'touchStart');
  await fireEvent(맨바깥, 'touchEnd');

  expect(내리기).not.toHaveBeenCalled();
  내리기.mockRestore();
});

it('말풍선 글자는 selectable 이다', async () => {
  const 말풍선 = await 방을그린다();

  expect(말풍선.props.selectable).toBe(true);
});

it('짧게 눌렀다 떼면 글자 말풍선을 갈아 끼운다', async () => {
  // 갈아 끼워야 네이티브 TextView 가 새로 그려지고 그 김에 선택이 풀린다.
  await 방을그린다();
  const 처음 = mock마운트.글자;
  const 맨바깥 = screen.getByTestId('chat-room-screen');

  await fireEvent(맨바깥, 'touchStart');
  await fireEvent(맨바깥, 'touchEnd');

  expect(mock마운트.글자).toBeGreaterThan(처음);
});

it('사진 말풍선은 갈아 끼우지 않는다', async () => {
  // ⚠️ 사진 조각은 「확대창이 열렸다」를 자기 상태로 들고 있다. 갈아 끼우면
  //    보고 있던 확대창이 닫힌다. 사진에는 selectable 글자도 없어 풀 것이 없다.
  await 방을그린다();
  const 처음 = mock마운트.사진;
  const 맨바깥 = screen.getByTestId('chat-room-screen');

  await fireEvent(맨바깥, 'touchStart');
  await fireEvent(맨바깥, 'touchEnd');

  expect(mock마운트.사진).toBe(처음);
});
