import {
  PasswordResetRejectedError,
  resetPassword,
  sendResetCode,
  verifyResetCode,
} from './api';

const mockFetch = jest.fn();

function reply(status: number, body: unknown = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

beforeEach(() => {
  mockFetch.mockReset();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
});

describe('sendResetCode', () => {
  it('본문에 이메일을 담아 POST한다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: null }));
    await sendResetCode('me@cuddle.com');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/auth/password/reset/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'me@cuddle.com' }),
      })
    );
  });

  // ⚠️ **아래 시험은 #849 2단계에서 뒤집혔다.** 예전에는 「소셜이면 reason: social 로
  //    던진다」·「없는 이메일이면 서버 문구를 그대로 담아 던진다」를 지켰는데,
  //    그 서버 문구가 화면으로 나가는 것이 곧 계정 열거였다.
  //    이제 서버는 셋 모두에 200 을 주고, 앱은 **서버 문구를 아예 안 본다.**

  it('서버 문구로 갈래를 만들지 않는다 — 400 이 와도 뭉뚱그린 오류다', async () => {
    mockFetch.mockResolvedValue(
      reply(400, {
        code: 'BAD_REQUEST',
        message: '소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.',
      })
    );
    // 옛 서버(아직 안 배포된 상태)가 갈라 말해도 앱은 그 문구를 안 옮긴다
    await expect(sendResetCode('me@cuddle.com')).rejects.not.toBeInstanceOf(
      PasswordResetRejectedError
    );
    await expect(sendResetCode('me@cuddle.com')).rejects.toThrow('인증코드 발송에 실패했어요');
  });

  it('서버가 준 문구가 오류 메시지에 새어 나가지 않는다', async () => {
    mockFetch.mockResolvedValue(
      reply(400, { code: 'BAD_REQUEST', message: '등록되지 않은 이메일입니다.' })
    );
    // ⚠️ 「원인」을 직접 본다 — 서버 문구가 그대로 실려 나가면 화면이 그것을 보여줄 수 있다
    await expect(sendResetCode('nobody@cuddle.com')).rejects.toThrow(
      expect.not.stringContaining('등록되지 않은')
    );
  });

  it('500이면 일반 오류를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500, {}));
    await expect(sendResetCode('me@cuddle.com')).rejects.toThrow('인증코드 발송에 실패했어요');
  });
});

describe('verifyResetCode', () => {
  it('본문에 이메일과 코드를 담아 POST한다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: true }));
    await verifyResetCode('me@cuddle.com', '123456');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/auth/password/reset/verify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'me@cuddle.com', verificationCode: '123456' }),
      })
    );
  });

  it('코드가 틀리면 던지지 않고 false를 준다', async () => {
    mockFetch.mockResolvedValue(reply(400, { message: '만료되었거나 잘못된 코드입니다.' }));
    await expect(verifyResetCode('me@cuddle.com', '000000')).resolves.toBe(false);
  });
});

describe('resetPassword', () => {
  it('PATCH로 셋을 모두 보낸다 — confirmPassword 를 빠뜨리면 서버가 400을 준다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: null }));
    await resetPassword({
      email: 'me@cuddle.com',
      newPassword: 'Abcdef1!xy',
      confirmPassword: 'Abcdef1!xy',
    });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/auth/password/reset',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          email: 'me@cuddle.com',
          newPassword: 'Abcdef1!xy',
          confirmPassword: 'Abcdef1!xy',
        }),
      })
    );
  });

  it('서버가 거절하면 그 문구를 담아 던진다', async () => {
    mockFetch.mockResolvedValue(reply(400, { message: '이메일 인증이 필요합니다.' }));
    await expect(
      resetPassword({
        email: 'me@cuddle.com',
        newPassword: 'Abcdef1!xy',
        confirmPassword: 'Abcdef1!xy',
      })
    ).rejects.toMatchObject({ message: '이메일 인증이 필요합니다.' });
  });
});
