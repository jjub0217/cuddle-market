import {
  SignUpRejectedError,
  checkEmailAvailable,
  checkNicknameAvailable,
  sendVerificationCode,
  signUp,
  verifyCode,
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

describe('checkEmailAvailable', () => {
  it('data가 true면 쓸 수 있는 이메일', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: true }));
    await expect(checkEmailAvailable('me@cuddle.com')).resolves.toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/auth/email/check?email=me%40cuddle.com',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('data가 false면 이미 가입된 이메일', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: false }));
    await expect(checkEmailAvailable('me@cuddle.com')).resolves.toBe(false);
  });
});

describe('sendVerificationCode', () => {
  it('본문에 이메일을 담아 POST한다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: null }));
    await sendVerificationCode('me@cuddle.com');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/auth/email/verification/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'me@cuddle.com' }),
      })
    );
  });

  it('서버가 실패하면 던진다', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(sendVerificationCode('me@cuddle.com')).rejects.toThrow();
  });
});

describe('verifyCode', () => {
  it('성공하면 true', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: true }));
    await expect(verifyCode('me@cuddle.com', '123456')).resolves.toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/auth/email/verification/verify',
      expect.objectContaining({
        body: JSON.stringify({ email: 'me@cuddle.com', verificationCode: '123456' }),
      })
    );
  });

  it('코드가 틀리면 false를 돌려준다 (던지지 않는다)', async () => {
    mockFetch.mockResolvedValue(reply(400, { message: '인증코드가 올바르지 않습니다.' }));
    await expect(verifyCode('me@cuddle.com', '000000')).resolves.toBe(false);
  });
});

describe('checkNicknameAvailable', () => {
  it('쿼리로 붙여 보낸다', async () => {
    mockFetch.mockResolvedValue(reply(200, { data: true }));
    await expect(checkNicknameAvailable('주현')).resolves.toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/auth/nickname/check?nickname=%EC%A3%BC%ED%98%84',
      expect.objectContaining({ method: 'GET' })
    );
  });
});

describe('signUp', () => {
  const input = {
    email: 'me@cuddle.com',
    password: 'Abcdef1!xy',
    name: '강주현',
    nickname: '주현',
    birthDate: '2000-03-07',
    addressSido: '서울특별시',
    addressGugun: '강남구',
  };

  it('성공하면 아무것도 던지지 않는다', async () => {
    mockFetch.mockResolvedValue(reply(201, { data: { id: 1 } }));
    await expect(signUp(input)).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test.local/api/auth/signup',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) })
    );
  });

  it('409면 서버 문구를 담아 SignUpRejectedError를 던진다', async () => {
    mockFetch.mockResolvedValue(reply(409, { message: '이미 사용 중인 이메일입니다.' }));
    await expect(signUp(input)).rejects.toThrow(SignUpRejectedError);
    await expect(signUp(input)).rejects.toThrow('이미 사용 중인 이메일입니다.');
  });

  it('400이면서 문구가 없으면 기본 문구를 쓴다', async () => {
    mockFetch.mockResolvedValue(reply(400, {}));
    await expect(signUp(input)).rejects.toThrow('입력 정보를 다시 확인해주세요.');
  });

  it('500이면 SignUpRejectedError가 아니라 일반 오류', async () => {
    mockFetch.mockResolvedValue(reply(500));
    await expect(signUp(input)).rejects.not.toBeInstanceOf(SignUpRejectedError);
  });
});
