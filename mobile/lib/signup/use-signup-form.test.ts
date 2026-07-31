// 서버 호출 다섯 개만 가짜로 바꾸고 SignUpRejectedError는 진짜를 쓴다.
// 통째로 automock하면 오류 클래스의 생성자까지 빈 껍데기가 되어 message가 사라진다.
jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  checkEmailAvailable: jest.fn(),
  sendVerificationCode: jest.fn(),
  verifyCode: jest.fn(),
  checkNicknameAvailable: jest.fn(),
  signUp: jest.fn(),
}));
jest.mock('../auth/session');

import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as session from '../auth/session';
import * as api from './api';
import { useSignupForm } from './use-signup-form';

const mockedApi = api as jest.Mocked<typeof api>;
const mockedSession = session as jest.Mocked<typeof session>;

type Form = ReturnType<typeof useSignupForm>;

/** 가입 직전까지 값을 다 채운다. 여러 테스트가 같은 준비를 쓴다. */
function fillEverything(form: Form) {
  form.setValue('password', 'Abcdef1!xy');
  form.setValue('passwordConfirm', 'Abcdef1!xy');
  form.setValue('name', '강주현');
  form.setValue('nickname', '주현');
  form.setValue('birthYear', '2000');
  form.setValue('birthMonth', '03');
  form.setValue('birthDay', '07');
  form.setValue('addressSido', '서울특별시');
  form.setValue('addressGugun', '강남구');
}

/** 이메일 인증을 끝까지 통과시킨다. */
async function passVerification(result: { current: Form }) {
  await act(async () => result.current.setValue('email', 'me@cuddle.com'));
  await act(async () => {
    await result.current.sendCode();
  });
  await act(async () => result.current.setValue('code', '123456'));
  await act(async () => {
    await result.current.submitCode();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  mockedApi.checkEmailAvailable.mockResolvedValue(true);
  mockedApi.sendVerificationCode.mockResolvedValue(undefined);
  mockedApi.verifyCode.mockResolvedValue(true);
  mockedApi.checkNicknameAvailable.mockResolvedValue(true);
  mockedApi.signUp.mockResolvedValue(undefined);
  mockedSession.login.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('인증 흐름', () => {
  it('코드를 보내면 sent가 되고 타이머가 299초부터 내려간다', async () => {
    const { result } = await renderHook(() => useSignupForm());

    await act(async () => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.verification).toBe('sent');
    expect(result.current.secondsLeft).toBe(299);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.secondsLeft).toBe(297);
  });

  it('이미 가입된 이메일이면 코드를 안 보내고 오류를 남긴다', async () => {
    mockedApi.checkEmailAvailable.mockResolvedValue(false);
    const { result } = await renderHook(() => useSignupForm());

    await act(async () => result.current.setValue('email', 'taken@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });

    expect(mockedApi.sendVerificationCode).not.toHaveBeenCalled();
    expect(result.current.verification).toBe('idle');
    expect(result.current.errors.email).toBeTruthy();
  });

  it('이메일 형식이 틀리면 서버를 아예 안 부른다', async () => {
    const { result } = await renderHook(() => useSignupForm());

    await act(async () => result.current.setValue('email', 'not-an-email'));
    await act(async () => {
      await result.current.sendCode();
    });

    expect(mockedApi.checkEmailAvailable).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBe('이메일 형식이 올바르지 않습니다');
  });

  it('코드가 맞으면 verified가 된다', async () => {
    const { result } = await renderHook(() => useSignupForm());
    await passVerification(result);

    expect(result.current.verification).toBe('verified');
  });

  it('코드가 틀리면 sent에 머물고 오류를 남긴다', async () => {
    mockedApi.verifyCode.mockResolvedValue(false);
    const { result } = await renderHook(() => useSignupForm());

    await act(async () => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });
    await act(async () => result.current.setValue('code', '000000'));
    await act(async () => {
      await result.current.submitCode();
    });

    expect(result.current.verification).toBe('sent');
    expect(result.current.errors.code).toBeTruthy();
  });

  it('인증이 끝난 뒤 sendCode를 불러도 서버를 안 부른다', async () => {
    const { result } = await renderHook(() => useSignupForm());
    await passVerification(result);

    mockedApi.sendVerificationCode.mockClear();
    await act(async () => {
      await result.current.sendCode();
    });

    expect(mockedApi.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('changeEmail을 부르면 idle로 돌아가고 코드가 비워진다', async () => {
    const { result } = await renderHook(() => useSignupForm());
    await passVerification(result);

    await act(async () => result.current.changeEmail());

    expect(result.current.verification).toBe('idle');
    expect(result.current.values.code).toBe('');
  });

  it('5분이 지나면 idle로 돌아간다', async () => {
    const { result } = await renderHook(() => useSignupForm());

    await act(async () => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });
    await act(async () => {
      jest.advanceTimersByTime(300_000);
    });

    expect(result.current.verification).toBe('idle');
  });

  it('인증이 끝나면 타이머가 멈춘다', async () => {
    const { result } = await renderHook(() => useSignupForm());
    await passVerification(result);

    await act(async () => {
      jest.advanceTimersByTime(300_000);
    });

    expect(result.current.verification).toBe('verified');
  });
});

describe('닉네임 중복체크', () => {
  it('닉네임을 고치면 nicknameChecked가 꺼진다', async () => {
    const { result } = await renderHook(() => useSignupForm());

    await act(async () => result.current.setValue('nickname', '주현'));
    await act(async () => {
      await result.current.checkNickname();
    });
    expect(result.current.nicknameChecked).toBe(true);

    await act(async () => result.current.setValue('nickname', '주현2'));
    expect(result.current.nicknameChecked).toBe(false);
  });

  it('이미 쓰는 닉네임이면 켜지지 않는다', async () => {
    mockedApi.checkNicknameAvailable.mockResolvedValue(false);
    const { result } = await renderHook(() => useSignupForm());

    await act(async () => result.current.setValue('nickname', '주현'));
    await act(async () => {
      await result.current.checkNickname();
    });

    expect(result.current.nicknameChecked).toBe(false);
    expect(result.current.errors.nickname).toBeTruthy();
  });
});

describe('canGoNext (B안 1단계)', () => {
  it('인증이 끝나고 비밀번호가 맞아야 켜진다', async () => {
    const { result } = await renderHook(() => useSignupForm());
    await passVerification(result);
    expect(result.current.canGoNext).toBe(false);

    await act(async () => {
      result.current.setValue('password', 'Abcdef1!xy');
      result.current.setValue('passwordConfirm', 'Abcdef1!xy');
    });
    expect(result.current.canGoNext).toBe(true);
  });

  it('인증을 안 했으면 비밀번호가 맞아도 안 켜진다', async () => {
    const { result } = await renderHook(() => useSignupForm());

    await act(async () => {
      result.current.setValue('password', 'Abcdef1!xy');
      result.current.setValue('passwordConfirm', 'Abcdef1!xy');
    });

    expect(result.current.canGoNext).toBe(false);
  });
});

describe('submit', () => {
  it('가입에 성공하면 곧바로 로그인하고 true를 돌려준다', async () => {
    const { result } = await renderHook(() => useSignupForm());
    await passVerification(result);
    await act(async () => fillEverything(result.current));
    await act(async () => {
      await result.current.checkNickname();
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(true);
    expect(mockedApi.signUp).toHaveBeenCalledWith({
      email: 'me@cuddle.com',
      password: 'Abcdef1!xy',
      name: '강주현',
      nickname: '주현',
      birthDate: '2000-03-07',
      addressSido: '서울특별시',
      addressGugun: '강남구',
    });
    expect(mockedSession.login).toHaveBeenCalledWith('me@cuddle.com', 'Abcdef1!xy');
  });

  it('서버가 거부하면 false를 돌려주고 formError에 서버 문구가 담긴다', async () => {
    mockedApi.signUp.mockRejectedValue(
      new api.SignUpRejectedError('이미 사용 중인 닉네임입니다.')
    );
    const { result } = await renderHook(() => useSignupForm());
    await passVerification(result);
    await act(async () => fillEverything(result.current));
    await act(async () => {
      await result.current.checkNickname();
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    await waitFor(() => expect(result.current.formError).toBe('이미 사용 중인 닉네임입니다.'));
    expect(ok).toBe(false);
    expect(mockedSession.login).not.toHaveBeenCalled();
  });

  it('중복체크를 안 했으면 서버를 안 부른다', async () => {
    const { result } = await renderHook(() => useSignupForm());
    await passVerification(result);
    await act(async () => fillEverything(result.current));

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(mockedApi.signUp).not.toHaveBeenCalled();
    expect(result.current.errors.nickname).toBe('닉네임 중복체크를 완료해주세요.');
  });

  it('거주지를 안 골랐으면 서버를 안 부른다', async () => {
    const { result } = await renderHook(() => useSignupForm());
    await passVerification(result);
    await act(async () => {
      fillEverything(result.current);
      result.current.setValue('addressSido', '');
      result.current.setValue('addressGugun', '');
    });
    await act(async () => {
      await result.current.checkNickname();
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.submit();
    });

    expect(ok).toBe(false);
    expect(mockedApi.signUp).not.toHaveBeenCalled();
    expect(result.current.errors.addressSido).toBe('거주지를 선택해주세요');
  });
});
