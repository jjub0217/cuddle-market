import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { ChatRoomSummary } from '@/lib/chat/api';

import { ChatRoomInfo } from './chat-room-info';

// 채팅방 머리말(#889). 여기서 지키는 것은 셋이다.
//   1. 서버가 값을 안 줘도 안 깨진다
//   2. 탈퇴한 상대에게는 프로필로 가는 길을 안 만든다
//   3. 상품을 누르면 **그룹까지 적힌** 주소로 민다 (안 적으면 뒤로가기가 어긋난다)
//
// ⚠️ @testing-library/react-native 14의 render·fireEvent는 기다려야 한다.
//    안 기다리면 fireEvent는 오류 없이 옛 값을 준다 — 조용히 틀린 것을 통과시킨다(mobile/AGENTS.md).

// ⚠️ 밖에서 만든 jest.fn() 을 공장 안에서 쓰면 안 된다 — jest.mock 은 import 위로 끌어올려져서
//    그때는 아직 만들어지기 전이다. 공장 안에서 만들고 requireMock 으로 도로 꺼낸다.
jest.mock('expo-router', () => {
  const push = jest.fn();
  return { useRouter: () => ({ push }), __push: push };
});

const { __push: push } = jest.requireMock('expo-router') as { __push: jest.Mock };

/** 서버가 다 준 방. 값이 빠지는 경우는 시험마다 덮어쓴다. */
function 방(덮어쓰기: Partial<ChatRoomSummary> = {}): ChatRoomSummary {
  return {
    opponentId: 9,
    opponentNickname: '홍길동',
    opponentProfileImageUrl: null,
    productId: 3,
    productTitle: '개구리 사료',
    productPrice: 12000,
    productImageUrl: 'https://cdn/x.webp',
    ...덮어쓰기,
  };
}

/** 서버가 아직 아무것도 안 얹어 준 상태. */
const 빈방: ChatRoomSummary = {
  opponentId: null,
  opponentNickname: null,
  opponentProfileImageUrl: null,
  productId: null,
  productTitle: null,
  productPrice: null,
  productImageUrl: null,
};

beforeEach(() => {
  push.mockReset();
});

it('상대와 상품이 보인다', async () => {
  await render(<ChatRoomInfo room={방()} />);

  expect(screen.getByText('홍길동')).toBeTruthy();
  expect(screen.getByText('개구리 사료')).toBeTruthy();
  // 웹 ChatProductCard 와 같은 표기다 — 「12,000원」
  expect(screen.getByText('12,000원')).toBeTruthy();
});

it('상품을 누르면 홈 스택의 상품 상세로 간다', async () => {
  await render(<ChatRoomInfo room={방()} />);

  await fireEvent.press(screen.getByLabelText('개구리 사료 상세 보기'));

  // ⚠️ 그룹((home))이 빠지면 expo-router 가 알아서 홈으로 옮겨간 뒤 쌓아 뒤로가기가 어긋난다.
  expect(push).toHaveBeenCalledWith('/(tabs)/(home)/products/3');
});

it('상대를 누르면 그 사람 프로필로 간다', async () => {
  await render(<ChatRoomInfo room={방()} />);

  await fireEvent.press(screen.getByLabelText('홍길동 프로필 보기'));

  expect(push).toHaveBeenCalledWith('/(tabs)/(home)/users/9');
});

// 탈퇴는 소프트 삭제라 방과 대화가 그대로 남는다. 이름은 보여주되 갈 곳이 없다 —
// 웹도 그렇게 한다(ChatRoomInfo.tsx:154).
it('탈퇴한 상대는 이름만 보이고 프로필로 가는 길이 없다', async () => {
  await render(
    <ChatRoomInfo room={방({ opponentId: null, opponentNickname: '알 수 없는 사용자' })} />
  );

  expect(screen.getByText('알 수 없는 사용자')).toBeTruthy();
  expect(screen.queryByLabelText('알 수 없는 사용자 프로필 보기')).toBeNull();
});

// ⚠️ **서버가 아직 안 얹어 준다.** 그때 오류를 던지거나 빈 띠를 남기면 안 된다.
it('서버가 아무것도 안 주면 머리말을 안 그린다', async () => {
  await render(<ChatRoomInfo room={빈방} />);

  expect(screen.toJSON()).toBeNull();
});

it('상품만 오면 상품칸만 그린다', async () => {
  await render(<ChatRoomInfo room={방({ opponentId: null, opponentNickname: null })} />);

  expect(screen.getByText('개구리 사료')).toBeTruthy();
  expect(screen.queryByText('홍길동')).toBeNull();
});

it('상품이 없으면 상품칸을 안 그린다', async () => {
  await render(<ChatRoomInfo room={방({ productId: null, productTitle: null })} />);

  expect(screen.getByText('홍길동')).toBeTruthy();
  expect(screen.queryByLabelText('상품 상세 보기')).toBeNull();
});

// 값이 반쪽만 와도 화면이 서면 안 된다.
it('가격이 없으면 가격 줄만 빠진다', async () => {
  await render(<ChatRoomInfo room={방({ productPrice: null })} />);

  expect(screen.getByText('개구리 사료')).toBeTruthy();
  expect(screen.queryByText(/원$/)).toBeNull();
});
