import type { ChatMessage } from './api';
import { appendNew, groupByDay, prependOlder } from './messages';

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
