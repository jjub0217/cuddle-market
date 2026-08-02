import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { CommentInput } from './comment-input';

// 커서 자리를 다루는 부분만 본다.
//
// 왜 여기에 시험을 두나: 계획서는 `setNativeProps({ selection })`으로 커서를 옮기라고
// 했는데, 이 앱은 새 아키텍처(app.json의 newArchEnabled)라 그 방법을 못 써서
// `selection` prop으로 바꿨다. 계획서를 뒤집은 자리는 조용히 되돌아가기 쉽다.
//
// 사용자가 웹에서 짚었던 것: 「깜박이는 커서가 @ 기호 **앞**에서 깜박입니다.
// @닉네임 **뒤**에서 깜박여야 할것 같습니다.」 — 앞에서 깜박이면 이어 친 글이
// 「안녕@협주 」가 되어 서버가 대상을 못 알아본다.

const NOOP = () => {};
const SUBMIT = async () => true;

// ⚠️ @testing-library/react-native 14의 render는 기다려야 한다(async).
//    안 기다리면 «render function has not been called»가 뜬다.
function renderInput(replyTo: { commentId: number; nickname: string } | null) {
  return render(
    <CommentInput replyTo={replyTo} onSubmit={SUBMIT} onCancelReply={NOOP} submitting={false} />
  );
}

const input = () => screen.getByPlaceholderText('답글을 입력하세요');

describe('답글 대상이 생기면', () => {
  it('@닉네임을 채운다', async () => {
    await renderInput({ commentId: 34, nickname: '협주' });

    expect(input().props.value).toBe('@협주 ');
  });

  it('커서를 @닉네임 **뒤**에 둔다', async () => {
    await renderInput({ commentId: 34, nickname: '협주' });

    // '@협주 ' = 4글자. 시작이 0이면 @ 앞에서 깜박이는 것이다
    expect(input().props.selection).toEqual({ start: 4, end: 4 });
  });

  it('누구에게 다는 중인지 알려 준다', async () => {
    await renderInput({ commentId: 34, nickname: '협주' });

    expect(screen.getByText('협주님에게 답글 남기는 중')).toBeTruthy();
  });
});

describe('커서를 언제 놓나', () => {
  // 계속 붙잡고 있으면 사용자가 커서를 옮길 수 없다.

  it('부탁한 자리에 닿으면 놓는다', async () => {
    await renderInput({ commentId: 34, nickname: '협주' });

    await fireEvent(input(), 'selectionChange', {
      nativeEvent: { selection: { start: 4, end: 4 } },
    });

    expect(input().props.selection).toBeUndefined();
  });

  it('사람이 치기 시작하면 놓는다', async () => {
    await renderInput({ commentId: 34, nickname: '협주' });

    await fireEvent.changeText(input(), '@협주 안녕');

    expect(input().props.selection).toBeUndefined();
  });
});

describe('대상이 없을 때', () => {
  it('아무것도 안 채우고 커서도 안 잡는다', async () => {
    // 화면에 들어오자마자 초점이 가서 키보드가 튀어 오르면 어리둥절하다
    await renderInput(null);

    const field = screen.getByPlaceholderText('댓글을 입력하세요');
    expect(field.props.value).toBe('');
    expect(field.props.selection).toBeUndefined();
  });

  it('「~님에게 답글 남기는 중」을 안 그린다', async () => {
    await renderInput(null);

    expect(screen.queryByText(/답글 남기는 중/)).toBeNull();
  });
});
