import { render, screen } from '@testing-library/react-native';
import React from 'react';

import type { ChatMessage } from '@/lib/chat/api';

import { MessageBubble } from './message-bubble';

// 말풍선 네 갈래 중 **사진**을 지킨다(#900).
//
// ⚠️ 사진 메시지는 `content` 가 비어 있고 `imageUrl` 에만 값이 있다. 그리지 않으면
//    **빈 말풍선**이 뜬다 — 앱에서 보낼 길이 없던 동안에도 웹에서 보낸 사진은 이미 오고 있었다.
//
// ⚠️ @testing-library/react-native 14 의 render 는 기다려야 한다(mobile/AGENTS.md).

function 메시지(덮어쓰기: Partial<ChatMessage> = {}): ChatMessage {
  return {
    messageId: 1,
    senderId: 9,
    senderNickname: '홍길동',
    messageType: 'TEXT',
    content: '안녕하세요',
    imageUrl: null,
    isBlocked: false,
    blockReason: null,
    createdAt: '2026-08-11T07:12:42',
    isMine: false,
    ...덮어쓰기,
  };
}

it('글 메시지는 내용을 그린다', async () => {
  await render(<MessageBubble message={메시지()} />);

  expect(screen.getByText('안녕하세요')).toBeTruthy();
});

it('사진 메시지는 그림을 그린다', async () => {
  await render(
    <MessageBubble
      message={메시지({ messageType: 'IMAGE', content: '', imageUrl: 'https://cdn/a.webp' })}
    />
  );

  // 빈 말풍선이 아니라 그림이 자리를 잡는다.
  expect(screen.getByLabelText('받은 사진')).toBeTruthy();
  expect(screen.queryByText('사진을 불러오지 못했어요')).toBeNull();
});

// 사진 주소가 없거나 깨져도 자리는 남긴다 — 웹도 자리표시자를 둔다.
it('사진 주소가 없으면 안내를 그린다', async () => {
  await render(
    <MessageBubble message={메시지({ messageType: 'IMAGE', content: '', imageUrl: null })} />
  );

  expect(screen.getByText('사진을 불러오지 못했어요')).toBeTruthy();
});

// 개인정보로 막힌 메시지는 보낸 사람에게만 온다. 표시가 없으면 정상으로 보이고
// 상대는 못 받아 「읽씹당했다」고 오해한다.
it('막힌 메시지에는 안내가 붙는다', async () => {
  await render(<MessageBubble message={메시지({ isBlocked: true, isMine: true })} />);

  expect(screen.getByText('개인정보 포함으로 상대방에게 전송되지 않았습니다.')).toBeTruthy();
});
