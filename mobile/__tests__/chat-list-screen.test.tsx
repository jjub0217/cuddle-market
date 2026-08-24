import { act, render, screen, waitFor } from '@testing-library/react-native';

import ChatRoomsScreen from '@/app/(tabs)/(chat)/index';
import { useAuthStore } from '@/lib/auth/store';
import { createScreenWrapper } from '@/test-utils/query-wrapper';

// 채팅 목록 화면이 **게스트를 어떻게 맞이하는가**(#916).
//
// 탭 누름 가로채기(app/(tabs)/_layout.tsx)는 **누를 때만** 걸린다. 앱을 껐다 켤 때
// 채팅 탭이 열린 채로 시작하면 누름이 없어서 안 걸리고, 예전에는 그대로 401 을 받아
// 「채팅 목록을 불러오지 못했어요」가 떴다 — 서버 탈처럼 읽히는 문구다.
//
// ⚠️ **`app/` 안에 두지 않는다.** expo-router 는 `app/` 의 모든 파일을 화면으로 봐서
//    시험 파일까지 앱 번들에 끼워 넣으려다 **실기기가 아예 안 뜬다**(#857).
//
// ⚠️ render 는 기다려야 한다(mobile/AGENTS.md).

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  // 화면에 초점이 갈 때 도는 것이다. 시험에서는 화면이 하나뿐이라 「그려지면 초점」으로 본다.
  //
  // ⚠️ **`useEffect` 로 감싸야 한다.** 그냥 부르면 그리는 도중에 refetch 가 돌아
  //    다시 그리기가 끝없이 이어지고, 화면이 뼈대(LoadingState)에서 못 벗어난다.
  //
  // ⚠️ 이 안에서는 위쪽 import 를 쓸 수 없다(jest 가 이 함수를 import 보다 먼저 올린다).
  //    react 는 여기서 다시 부른다.
  useFocusEffect: (callback: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect } = require('react') as typeof import('react');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(callback, [callback]);
  },
}));

jest.mock('@/lib/chat/api', () => ({ fetchChatRooms: jest.fn() }));

// ⚠️ 진짜 소켓을 두면 로그인한 갈래에서 **정말 붙으러 간다** — 시험에는 서버 주소
//    환경값이 없어 「EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다」로 죽는다.
jest.mock('@/lib/chat/socket', () => ({
  chatSocket: {
    acquire: jest.fn(),
    release: jest.fn(),
    subscribe: jest.fn(() => () => {}),
    publish: jest.fn(() => true),
    isConnected: jest.fn(() => false),
  },
}));

const { fetchChatRooms } = jest.requireMock('@/lib/chat/api') as {
  fetchChatRooms: jest.Mock;
};
const { chatSocket } = jest.requireMock('@/lib/chat/socket') as {
  chatSocket: { acquire: jest.Mock; release: jest.Mock; subscribe: jest.Mock };
};

// 방 줄에 사진 자리가 있어 안전영역을 쓰는 조각이 딸려 온다 — 감싸 줘야 한다.
// 안전영역 값과 QueryClient 설정은 mobile/test-utils/query-wrapper.tsx 로 모았다(#1059).
const 감싸기 = createScreenWrapper({ safeArea: true });

const 오류문구 = '채팅 목록을 불러오지 못했어요.';

beforeEach(() => {
  fetchChatRooms.mockReset();
  fetchChatRooms.mockResolvedValue({ hasNext: false, rooms: [] });
  chatSocket.acquire.mockClear();
  chatSocket.release.mockClear();
  useAuthStore.setState({ status: 'authed', accessToken: 'token', refreshToken: 'refresh' });
});

it('게스트면 로그인 안내를 보여준다', async () => {
  useAuthStore.setState({ status: 'guest', accessToken: null, refreshToken: null });

  await render(<ChatRoomsScreen />, { wrapper: 감싸기 });

  // 마이 탭과 **같은 문구·같은 단추**다.
  expect(screen.getByText('로그인이 필요합니다.')).toBeTruthy();
  expect(screen.getByRole('button', { name: '로그인하기' })).toBeTruthy();
});

it('게스트면 오류 문구가 안 보인다', async () => {
  // 이것이 #916 의 알맹이다 — 로그인이 필요한 것을 서버 탈로 보여 주면 안 된다.
  //
  // ⚠️ **불러오기를 실패하게 해 둔다.** 게스트가 부르면 서버가 401 을 주고
  //    `fetchChatRooms` 가 그걸 던진다 — 그게 화면에서 오류 문구가 되던 길이다.
  //    성공으로 두면 고치기 전 코드도 이 시험을 통과해 버려서 아무것도 못 지킨다.
  fetchChatRooms.mockRejectedValue(new Error('채팅 목록을 불러오지 못했어요 (HTTP 401)'));
  useAuthStore.setState({ status: 'guest', accessToken: null, refreshToken: null });

  await render(<ChatRoomsScreen />, { wrapper: 감싸기 });
  // 실패가 화면까지 닿을 틈을 준다. 안 불렀으니 아무 일도 없어야 한다.
  await act(async () => {
    await Promise.resolve();
  });

  expect(screen.queryByText(오류문구)).toBeNull();
  // 빈 목록 문구도 새어 나오면 안 된다 — 방이 없는 게 아니라 못 보는 것이다.
  expect(screen.queryByText('채팅을 시작해보세요')).toBeNull();
});

it('게스트면 목록을 아예 안 부른다', async () => {
  // 부르면 401 이 오고, 그 401 이 오류 문구가 된다. 초점이 가도(useFocusEffect)
  // 부르지 않아야 한다.
  useAuthStore.setState({ status: 'guest', accessToken: null, refreshToken: null });

  await render(<ChatRoomsScreen />, { wrapper: 감싸기 });

  expect(fetchChatRooms).not.toHaveBeenCalled();
  // 소켓도 안 잡는다 — 토큰 없이 붙으면 물리쳐지고 5초마다 헛되이 다시 두드린다.
  expect(chatSocket.acquire).not.toHaveBeenCalled();
});

it('토큰을 읽는 동안에는 안내를 안 띄운다', async () => {
  // ⚠️ 앱 켠 직후('restoring')는 **로그인돼 있는데도** 아직 모르는 때다.
  //    여기서 밀어내면 로그인한 사람이 안내를 보게 된다.
  useAuthStore.setState({ status: 'restoring', accessToken: null, refreshToken: null });

  await render(<ChatRoomsScreen />, { wrapper: 감싸기 });

  expect(screen.queryByText('로그인이 필요합니다.')).toBeNull();
  expect(screen.queryByText(오류문구)).toBeNull();
});

it('로그인했으면 목록을 부르고 안내는 안 띄운다', async () => {
  await render(<ChatRoomsScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(fetchChatRooms).toHaveBeenCalled());
  expect(screen.queryByText('로그인이 필요합니다.')).toBeNull();
  expect(chatSocket.acquire).toHaveBeenCalled();
});

it('로그인했는데 요청이 실패하면 그때는 오류 문구를 쓴다', async () => {
  // 안내를 넣느라 진짜 서버 탈을 못 보게 되면 안 된다.
  fetchChatRooms.mockRejectedValue(new Error('그물이 끊겼어요'));

  await render(<ChatRoomsScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText(오류문구)).toBeTruthy());
});
