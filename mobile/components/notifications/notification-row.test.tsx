import { render, screen } from '@testing-library/react-native';
import React from 'react';

import type { NotificationItem } from '@/lib/notifications';

import { NotificationRow } from './notification-row';

// 시각 표기가 shared의 getTimeAgo를 지나는지 본다.
//
// 왜 이 시험이 있나: 여기 같은 일을 하는 함수를 따로 두고 있었는데, 시간대가 없는 시각을
// `new Date(iso)`로 그냥 읽어서 한국에서 9시간이 빠졌다. 방금 온 알림이 「9시간 전」으로
// 보였다(2026-08-02 실기기). 서버는 시간대 없이 **UTC** 시각을 준다.
//
// 규칙 자체는 shared에서 지킨다. 여기서는 **그 함수를 쓰는지**만 못 박는다 —
// 다시 이 파일 안에 만들어 넣으면 여기서 걸린다.

const NOOP = () => {};

function item(createdAt: string): NotificationItem {
  return {
    notificationId: 1,
    notificationType: 'COMMENT_REPLY',
    title: '서버 제목(화면에는 안 쓴다)',
    content: '게이트정상798님이 내 댓글에 답글을 남겼습니다.',
    relatedEntityType: 'POST',
    relatedEntityId: 36,
    isRead: false,
    createdAt,
  };
}

describe('시각 표기', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-02T14:56:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('시간대가 없는 값을 UTC로 읽는다', async () => {
    // 서버가 방금 만든 알림. 한국 시간으로 오해하면 「9시간 전」이 된다
    await render(<NotificationRow item={item('2026-08-02T14:56:00')} onPress={NOOP} />);

    expect(screen.getByText('방금 전')).toBeTruthy();
  });

  it('Z가 붙어 있어도 그대로 읽는다', async () => {
    await render(<NotificationRow item={item('2026-08-02T11:56:00Z')} onPress={NOOP} />);

    expect(screen.getByText('3시간 전')).toBeTruthy();
  });
});
