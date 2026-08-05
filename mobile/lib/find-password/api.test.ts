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

  it('소셜 계정이면 reason이 social인 오류를 던진다', async () => {
    mockFetch.mockResolvedValue(
      reply(400, {
        code: 'BAD_REQUEST',
        message: '소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.',
      })
    );
    await expect(sendResetCode('me@cuddle.com')).rejects.toMatchObject({
      reason: 'social',
      message: '소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.',
    });
    await expect(sendResetCode('me@cuddle.com')).rejects.toBeInstanceOf(
      PasswordResetRejectedError
    );
  });

  it('없는 이메일이면 서버 문구를 그대로 담아 던진다', async () => {
    mockFetch.mockResolvedValue(
      reply(400, { code: 'BAD_REQUEST', message: '등록되지 않은 이메일입니다.' })
    );
    await expect(sendResetCode('nobody@cuddle.com')).rejects.toMatchObject({
      reason: 'unknown',
      message: '등록되지 않은 이메일입니다.',
    });
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
