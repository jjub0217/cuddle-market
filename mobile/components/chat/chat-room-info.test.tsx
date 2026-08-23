import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { ChatRoomSummary } from '@/lib/chat/api';

import { ChatRoomInfo } from './chat-room-info';

// 채팅방 머리말(#889). 여기서 지키는 것은 셋이다.
//   1. 서버가 값을 안 줘도 안 깨진다
//   2. 상품을 누르면 **그룹까지 적힌** 주소로 민다 (안 적으면 뒤로가기가 어긋난다)
//   3. 상대는 여기서 안 그린다 — 닉네임은 헤더로 갔다(#898)
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

it('상품이 보인다', async () => {
  await render(<ChatRoomInfo room={방()} />);

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

// 닉네임은 헤더 제목으로 올라갔다(#898). 여기에 또 그리면 같은 이름이 두 겹으로 보이고
// 대화가 그만큼 짧아진다. 프로필로 가는 길은 ⋮ 의 「프로필 보기」가 맡는다.
it('상대 이름은 여기서 안 그린다', async () => {
  await render(<ChatRoomInfo room={방()} />);

  expect(screen.queryByText('홍길동')).toBeNull();
  expect(screen.queryByLabelText('홍길동 프로필 보기')).toBeNull();
});

// ⚠️ **서버가 아직 안 얹어 준다.** 그때 오류를 던지거나 빈 띠를 남기면 안 된다.
it('서버가 아무것도 안 주면 머리말을 안 그린다', async () => {
  await render(<ChatRoomInfo room={빈방} />);

  expect(screen.toJSON()).toBeNull();
});

// 상대가 탈퇴해도 상품 이야기는 그대로다 — 방과 대화가 남기 때문이다.
it('상대가 탈퇴해도 상품칸은 그린다', async () => {
  await render(<ChatRoomInfo room={방({ opponentId: null, opponentNickname: '알 수 없는 사용자' })} />);

  expect(screen.getByText('개구리 사료')).toBeTruthy();
});

it('상품이 없으면 아무것도 안 그린다', async () => {
  await render(<ChatRoomInfo room={방({ productId: null, productTitle: null })} />);

  expect(screen.toJSON()).toBeNull();
});

// 값이 반쪽만 와도 화면이 서면 안 된다.
it('가격이 없으면 가격 줄만 빠진다', async () => {
  await render(<ChatRoomInfo room={방({ productPrice: null })} />);

  expect(screen.getByText('개구리 사료')).toBeTruthy();
  expect(screen.queryByText(/원$/)).toBeNull();
});

// ── 거래 상태 뱃지(#1035 의 앱 몫) ─────────────────────────────────────────────
//
// 웹과 같은 규칙이다(`ChatProductCard.tsx` 의 `getOverlay`).
//   COMPLETED → 어두운 막 + 「판매완료」(판매요청 상품은 「요청완료」)
//   RESERVED  → 조금 옅은 막 + 「예약중」
//   SELLING   → 아무것도 안 그린다
//
// ⚠️ 문구는 여기서 짓지 않는다. `@cuddle/shared` 의 `getTradeLabel` 이 정한 말이라,
//    이 시험이 지키는 것은 「그 말이 화면에 뜨는가」다.

it('판매 상품이 판매완료면 「판매완료」 뱃지가 보인다', async () => {
  await render(<ChatRoomInfo room={방()} tradeStatus="COMPLETED" productType="SELL" />);

  expect(screen.getByText('판매완료')).toBeTruthy();
});

it('판매요청 상품이 완료면 「요청완료」 뱃지가 보인다', async () => {
  await render(<ChatRoomInfo room={방()} tradeStatus="COMPLETED" productType="REQUEST" />);

  expect(screen.getByText('요청완료')).toBeTruthy();
  // 판매 상품의 말이 섞여 나오면 안 된다.
  expect(screen.queryByText('판매완료')).toBeNull();
});

it('판매 상품이 예약중이면 「예약중」 뱃지가 보인다', async () => {
  await render(<ChatRoomInfo room={방()} tradeStatus="RESERVED" productType="SELL" />);

  expect(screen.getByText('예약중')).toBeTruthy();
});

// 지금은 판매요청도 「예약중」으로 같다. 그래도 따로 재 두는 까닭은, 라벨을 공용 함수에
// 맡겨 두어서 **나중에 판매요청 쪽 문구가 갈리면 여기가 먼저 빨개지게** 하려는 것이다.
it('판매요청 상품이 예약중이어도 「예약중」 뱃지가 보인다', async () => {
  await render(<ChatRoomInfo room={방()} tradeStatus="RESERVED" productType="REQUEST" />);

  expect(screen.getByText('예약중')).toBeTruthy();
});

// ⚠️ 판매중에 「판매중」을 그리면 **모든 방에 뱃지가 붙는다.** 뱃지는 「보통이 아닌 상태」를
//    알리는 것이라 판매중에는 안 그린다. 웹도 그렇다.
it('판매중이면 뱃지를 안 그린다', async () => {
  await render(<ChatRoomInfo room={방()} tradeStatus="SELLING" productType="SELL" />);

  expect(screen.queryByText('판매중')).toBeNull();
});

// 상품을 아직 못 받았을 때다(질의가 도는 동안). 그때 「판매중」이 잠깐 떴다 사라지면 안 된다.
it('거래 상태를 안 주면 뱃지를 안 그린다', async () => {
  await render(<ChatRoomInfo room={방()} />);

  expect(screen.queryByText('판매완료')).toBeNull();
  expect(screen.queryByText('예약중')).toBeNull();
  expect(screen.queryByText('판매중')).toBeNull();
});
