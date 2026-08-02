import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { useAuthStore } from '@/lib/auth/store';

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

// 안내 문구가 로그인 여부에 따라 갈리므로 시험마다 정해 준다.
// 저장소 기본값은 'restoring'이라 아무것도 안 하면 게스트로 보인다.
function signIn() {
  useAuthStore.setState({ status: 'authed' });
}

function signOut() {
  useAuthStore.setState({ status: 'guest' });
}

beforeEach(signIn);

// ⚠️ @testing-library/react-native 14의 render는 기다려야 한다(async).
//    안 기다리면 «render function has not been called»가 뜬다.
function renderInput(replyTo: { commentId: number; nickname: string; depth: number } | null) {
  return render(
    <CommentInput replyTo={replyTo} onSubmit={SUBMIT} onCancelReply={NOOP} submitting={false} />
  );
}

const input = () => screen.getByPlaceholderText('답글을 입력하세요');

describe('답글 대상이 생기면', () => {
  it('@닉네임을 채운다', async () => {
    await renderInput({ commentId: 34, nickname: '협주', depth: 2 });

    expect(input().props.value).toBe('@협주 ');
  });

  it('커서를 @닉네임 **뒤**에 둔다', async () => {
    await renderInput({ commentId: 34, nickname: '협주', depth: 2 });

    // '@협주 ' = 4글자. 시작이 0이면 @ 앞에서 깜박이는 것이다
    expect(input().props.selection).toEqual({ start: 4, end: 4 });
  });

  it('누구에게 다는 중인지 알려 준다', async () => {
    await renderInput({ commentId: 34, nickname: '협주', depth: 2 });

    expect(screen.getByText('협주님에게 답글 남기는 중')).toBeTruthy();
  });
});

describe('커서를 언제 놓나', () => {
  // 계속 붙잡고 있으면 사용자가 커서를 옮길 수 없다.

  it('부탁한 자리에 닿으면 놓는다', async () => {
    await renderInput({ commentId: 34, nickname: '협주', depth: 2 });

    await fireEvent(input(), 'selectionChange', {
      nativeEvent: { selection: { start: 4, end: 4 } },
    });

    expect(input().props.selection).toBeUndefined();
  });

  it('사람이 치기 시작하면 놓는다', async () => {
    await renderInput({ commentId: 34, nickname: '협주', depth: 2 });

    await fireEvent.changeText(input(), '@협주 안녕');

    expect(input().props.selection).toBeUndefined();
  });
});

describe('게스트일 때', () => {
  // 칸에 「로그인해 주세요」라고 적어 놓고 글이 써지면 말과 행동이 다르다.
  // 그래서 글이 안 써지는 단추를 주고, 누르면 바로 로그인으로 보낸다.
  //
  // ⚠️ 웹은 「등록」을 눌러야 로그인을 띄운다. 일부러 다르게 간다 — 웹은 그 자리에
  //    작은 창이 뜨지만 앱은 화면이 통째로 넘어가서, 다 쓴 뒤에 끊기면 더 나쁘다.

  it('댓글 칸에 로그인하라고 알린다', async () => {
    signOut();
    await renderInput(null);

    expect(screen.getByText('댓글을 입력하려면 로그인해 주세요')).toBeTruthy();
  });

  it('답글 칸에도 알린다', async () => {
    signOut();
    await renderInput({ commentId: 34, nickname: '협주', depth: 2 });

    expect(screen.getByText('답글을 입력하려면 로그인해 주세요')).toBeTruthy();
  });

  it('글이 안 써진다', async () => {
    // 진짜 칸이면 키보드가 떴다가 화면이 넘어가 어수선하다
    signOut();
    await renderInput(null);

    expect(screen.queryByPlaceholderText('댓글을 입력하세요')).toBeNull();
    expect(screen.queryByPlaceholderText('댓글을 입력하려면 로그인해 주세요')).toBeNull();
  });

  it('누르면 로그인으로 보낸다', async () => {
    signOut();
    const onRequestLogin = jest.fn();
    await render(
      <CommentInput
        replyTo={null}
        onSubmit={SUBMIT}
        onCancelReply={NOOP}
        submitting={false}
        onRequestLogin={onRequestLogin}
      />
    );

    await fireEvent.press(screen.getByText('댓글을 입력하려면 로그인해 주세요'));

    expect(onRequestLogin).toHaveBeenCalled();
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
