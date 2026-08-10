import type { ChatMessage } from './api';
import { appendNew, groupByDay, messageKey, prependOlder, withIsMine } from './messages';

/** 시험용 메시지 하나. 필요한 것만 바꿔 쓴다. */
function msg(over: Partial<ChatMessage> = {}): ChatMessage {
  return {
    messageId: 1,
    senderId: 9,
    senderNickname: '홍길동',
    messageType: 'TEXT',
    content: '안녕하세요',
    imageUrl: null,
    isBlocked: false,
    blockReason: null,
    createdAt: '2026-08-10T07:12:42',
    isMine: false,
    ...over,
  };
}

describe('prependOlder', () => {
  it('과거를 앞에 붙인다', () => {
    const current = [msg({ messageId: 10 })];
    const older = [msg({ messageId: 8 }), msg({ messageId: 9 })];

    expect(prependOlder(current, older).map((m) => m.messageId)).toEqual([8, 9, 10]);
  });

  // 붙기 → 구독 → 조회 순서라 같은 메시지가 양쪽으로 들어올 수 있다.
  it('겹치는 것은 하나만 남긴다', () => {
    const current = [msg({ messageId: 10 })];
    const older = [msg({ messageId: 10 }), msg({ messageId: 9 })];

    expect(prependOlder(current, older).map((m) => m.messageId)).toEqual([9, 10]);
  });
});

describe('appendNew', () => {
  it('뒤에 붙인다', () => {
    const current = [msg({ messageId: 1 })];
    expect(appendNew(current, msg({ messageId: 2 })).map((m) => m.messageId)).toEqual([1, 2]);
  });

  it('이미 있는 것은 안 붙인다', () => {
    const current = [msg({ messageId: 1 })];
    expect(appendNew(current, msg({ messageId: 1 }))).toHaveLength(1);
  });
});

describe('groupByDay', () => {
  it('같은 날끼리 묶는다', () => {
    const a = new Date(2026, 7, 10, 9, 0).toISOString();
    const b = new Date(2026, 7, 10, 21, 0).toISOString();
    const c = new Date(2026, 7, 11, 9, 0).toISOString();

    const groups = groupByDay([
      msg({ messageId: 1, createdAt: a }),
      msg({ messageId: 2, createdAt: b }),
      msg({ messageId: 3, createdAt: c }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0].messages.map((m) => m.messageId)).toEqual([1, 2]);
    expect(groups[0].label).toBe('2026년 8월 10일 월요일');
    expect(groups[1].messages.map((m) => m.messageId)).toEqual([3]);
  });

  it('빈 목록은 빈 묶음이다', () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe('withIsMine', () => {
  // 서버가 통로마다 다른 DTO 를 보낸다. 소켓 쪽에는 isMine 이 아예 없다.
  it('소켓 메시지에는 senderId 로 채운다', () => {
    const fromSocket = { ...msg({ senderId: 9 }), isMine: undefined } as unknown as ChatMessage;

    expect(withIsMine(fromSocket, 9).isMine).toBe(true);
    expect(withIsMine(fromSocket, 5).isMine).toBe(false);
  });

  it('REST 가 준 isMine 은 그대로 믿는다', () => {
    const fromRest = msg({ senderId: 9, isMine: true });
    // 내 id 를 모르는 순간에도 서버가 판단한 값을 뒤집지 않는다.
    expect(withIsMine(fromRest, undefined).isMine).toBe(true);
  });

  it('내 id 를 아직 모르면 내 것이 아니라고 본다', () => {
    const fromSocket = { ...msg({ senderId: 9 }), isMine: undefined } as unknown as ChatMessage;
    expect(withIsMine(fromSocket, undefined).isMine).toBe(false);
  });
});

describe('id 가 없는 메시지 (나가기 안내)', () => {
  // 서버가 나가기 안내(SYSTEM)만 손으로 만들어 보내면서 messageId 를 안 채운다.
  // 앱이 id 로 겹침을 거르기 때문에, 안 다루면 두 번째부터 조용히 사라진다.
  const sys = (over: Partial<ChatMessage> = {}) =>
    ({
      ...msg({ messageType: 'SYSTEM', content: '홍길동님이 채팅방을 나가셨습니다.' }),
      messageId: undefined,
      ...over,
    }) as unknown as ChatMessage;

  it('id 가 없으면 거르지 않고 그대로 붙인다', () => {
    const after = appendNew(appendNew([], sys()), sys({ content: '김철수님이 채팅방을 나가셨습니다.' }));
    expect(after).toHaveLength(2);
  });

  it('열쇠가 겹치지 않는다', () => {
    const a = sys();
    const b = sys();
    expect(messageKey(a, 0)).not.toBe(messageKey(b, 1));
  });

  it('id 가 있으면 예전처럼 id 로 만든다', () => {
    expect(messageKey(msg({ messageId: 7 }), 0)).toBe('m-7');
  });

  it('과거를 앞에 붙여도 안내가 안 사라진다', () => {
    const current = [sys(), msg({ messageId: 10 })];
    const after = prependOlder(current, [msg({ messageId: 8 })]);

    expect(after).toHaveLength(3);
    expect(after.filter((m) => m.messageType === 'SYSTEM')).toHaveLength(1);
  });
});
