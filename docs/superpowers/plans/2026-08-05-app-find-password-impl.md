# 앱 비밀번호 찾기 구현 계획 (#838)

> **에이전트로 실행할 때:** 필수 하위 스킬 — `superpowers:subagent-driven-development`(권장) 또는 `superpowers:executing-plans`. 단계는 체크박스(`- [ ]`)로 따라간다.

**목표:** 앱 안에 비밀번호 찾기 화면(이메일 → 인증코드 → 새 비밀번호)을 만들고, 그 김에 웹의 소셜 계정 안내와 성공 알림도 채운다.

**접근:** 화면은 배치만, 로직은 훅. 서버를 모르는 조각(`Field`·`PasswordChecklist`·검증 함수)은 가입 화면 것을 그대로 쓰고, 서버를 아는 것(`api.ts`·훅)은 새로 쓴다. 가입과 재설정은 **서버가 하는 일이 정반대**라 조각을 묶지 않는다.

**설계 문서:** `docs/superpowers/specs/2026-08-05-app-find-password-design.md`

**기술:** Expo SDK 54 · React Native 0.81.5 · expo-router · Jest(jest-expo) · Next.js 웹은 vitest

## 전역 제약

- 브랜치는 `feature/838--app-find-password`. `develop`·`main`에 직접 커밋 금지
- 앱 게이트는 **저장소 루트에서** `pnpm gate:mobile` (tsc + expo lint + jest). `cd mobile` 뒤에 루트 명령을 치면 실패한다
- 웹 게이트는 루트에서 `pnpm gate`. lint 경고 상한이 36으로 잠겨 있다 — 늘리지 말 것
- `@testing-library/react-native` 14는 `render`·`fireEvent`·`rerender`를 **전부 await** 해야 한다. 안 하면 오류 없이 옛 값을 줘서 틀린 것을 조용히 통과시킨다
- 서버 주소는 셋 다 `permitAll`이라 토큰이 필요 없다. `apiFetch`(토큰 래퍼)가 아니라 **맨 `fetch`**를 쓴다
- 코드 만료는 **5분**(서버 `EmailVerificationServiceImpl`). 가입 훅이 `CODE_TTL_SECONDS = 300`으로 맞춰 뒀다
- 커밋 메시지는 한국어. 끝에 `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`
- 문구는 웹과 같게 쓴다. 새로 지어내지 말고 웹의 같은 화면을 먼저 찾을 것

## 파일 구조

| 파일 | 책임 |
| --- | --- |
| `mobile/lib/find-password/api.ts` (새) | 서버 주소 셋. 응답을 화면이 쓸 모양으로 바꾼다 |
| `mobile/lib/find-password/api.test.ts` (새) | 주소·본문이 DTO와 맞는지, 실패 응답 처리 |
| `mobile/lib/find-password/use-find-password.ts` (새) | 값·단계·타이머·검증·서버 호출 |
| `mobile/lib/find-password/use-find-password.test.ts` (새) | 단계 전이·타이머·실패하면 안 넘어감 |
| `mobile/components/find-password/step-indicator.tsx` (새) | 1-2-3 진행 표시 |
| `mobile/app/find-password.tsx` (새) | 화면. 단계별 배치만 |
| `mobile/app/login.tsx` (수정) | 아래 링크를 웹 열기 → 라우트 이동으로 |
| `mobile/components/auth/login-form.tsx` (수정) | 비밀번호 칸 아래에 링크 추가 |
| `mobile/lib/support-links.ts` (수정) | `FIND_PASSWORD_URL` 삭제 |
| `src/features/find-password/components/FindPasswordForm.tsx` (수정) | 웹 소셜 안내 + 성공 알림 |
| `src/features/find-password/components/FindPasswordForm.test.tsx` (수정) | 위 둘의 시험 추가 |

---

## Task 1: 서버와 이야기하는 층

**Files:**
- Create: `mobile/lib/find-password/api.ts`
- Test: `mobile/lib/find-password/api.test.ts`

**Interfaces:**
- Consumes: `apiBaseUrl()` (from `mobile/lib/auth/api.ts`)
- Produces:
  - `class PasswordResetRejectedError extends Error { reason: 'social' | 'unknown' }`
  - `sendResetCode(email: string): Promise<void>`
  - `verifyResetCode(email: string, code: string): Promise<boolean>`
  - `resetPassword(input: { email: string; newPassword: string; confirmPassword: string }): Promise<void>`

- [ ] **Step 1: 실패하는 시험을 쓴다**

`mobile/lib/find-password/api.test.ts`:

```ts
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
      reply(400, { code: 'BAD_REQUEST', message: '소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.' })
    );
    await expect(sendResetCode('me@cuddle.com')).rejects.toMatchObject({
      reason: 'social',
      message: '소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.',
    });
  });

  it('없는 이메일이면 서버 문구를 그대로 담아 던진다', async () => {
    mockFetch.mockResolvedValue(reply(400, { code: 'BAD_REQUEST', message: '등록되지 않은 이메일입니다.' }));
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
      resetPassword({ email: 'me@cuddle.com', newPassword: 'Abcdef1!xy', confirmPassword: 'Abcdef1!xy' })
    ).rejects.toMatchObject({ message: '이메일 인증이 필요합니다.' });
  });
});
```

- [ ] **Step 2: 시험이 실패하는지 확인한다**

```bash
cd mobile && npx jest lib/find-password/api.test.ts
```

기대: `Cannot find module './api'` 로 실패.

- [ ] **Step 3: 최소 구현을 쓴다**

`mobile/lib/find-password/api.ts`:

```ts
import { apiBaseUrl } from '../auth/api';

// 비밀번호 재설정 세 걸음. 로그인 전이라 토큰이 없어서 apiFetch(401 갱신 포함)가 아니라
// 순수 fetch를 쓴다 — 가입 api(lib/signup/api.ts)가 같은 이유로 같은 선택을 했다.
//
// ⚠️ 가입과 주소가 다르다. 가입은 /auth/email/verification/*, 재설정은 /auth/password/reset/*.
//    보내는 값은 같은데 서버가 하는 일이 정반대라서다 —
//      가입    「이 이메일 처음이신가요?」  처음이어야 통과
//      재설정  「이 이메일로 가입한 적 있나요?」 있어야 통과 (게다가 LOCAL 계정이어야 한다)

/** 서버가 400으로 「이래서 안 된다」고 알려준 경우. 화면이 서버 문구를 그대로 보여준다. */
export class PasswordResetRejectedError extends Error {
  /** 소셜 계정이면 화면이 「로그인하러 가기」 길을 함께 준다 */
  readonly reason: 'social' | 'unknown';

  constructor(message: string, reason: 'social' | 'unknown') {
    super(message);
    this.name = 'PasswordResetRejectedError';
    this.reason = reason;
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** 서버 응답 껍데기. 성공·실패 모두 { data, message } 모양이다. */
interface Envelope<T> {
  data?: T;
  message?: string;
}

async function readEnvelope<T>(res: Response): Promise<Envelope<T>> {
  try {
    return (await res.json()) as Envelope<T>;
  } catch {
    return {};
  }
}

/**
 * 소셜 계정인지 가리는 곳은 **여기 한 군데뿐이다.**
 *
 * 서버가 IllegalArgumentException 을 전부 code: 'BAD_REQUEST' 로 내려서
 * (GlobalExceptionHandler:99) 문구 말고는 구분할 단서가 없다. 서버가 사유를 코드로
 * 나눠 주면 그때 이 함수만 고치면 된다.
 */
function classify(message: string): 'social' | 'unknown' {
  return message.includes('소셜') ? 'social' : 'unknown';
}

export async function sendResetCode(email: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/auth/password/reset/send`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  });
  if (res.ok) return;

  const body = await readEnvelope<null>(res);
  if (res.status === 400 && body.message) {
    throw new PasswordResetRejectedError(body.message, classify(body.message));
  }
  throw new Error(`인증코드 발송에 실패했어요 (HTTP ${res.status})`);
}

/**
 * 코드가 틀린 것은 「오류」가 아니라 흔한 결과라서 던지지 않고 false를 돌려준다.
 * 가입 쪽 verifyCode 와 같은 규칙이다.
 */
export async function verifyResetCode(email: string, code: string): Promise<boolean> {
  const res = await fetch(`${apiBaseUrl()}/auth/password/reset/verify`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, verificationCode: code }),
  });

  if (res.status === 400 || res.status === 404) return false;
  if (!res.ok) throw new Error(`인증코드 확인에 실패했어요 (HTTP ${res.status})`);

  const body = await readEnvelope<boolean>(res);
  return body.data !== false;
}

/**
 * ⚠️ confirmPassword 도 함께 보내야 한다. PasswordResetRequest.java 가 셋 다 @NotBlank 다.
 *    「확인 칸은 앱에서만 검사하면 되겠지」 하고 빠뜨리면 400 이 난다.
 */
export async function resetPassword(input: {
  email: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/auth/password/reset`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });
  if (res.ok) return;

  const body = await readEnvelope<null>(res);
  if (res.status === 400 && body.message) {
    throw new PasswordResetRejectedError(body.message, classify(body.message));
  }
  throw new Error(`비밀번호 변경에 실패했어요 (HTTP ${res.status})`);
}
```

- [ ] **Step 4: 시험이 통과하는지 확인한다**

```bash
cd mobile && npx jest lib/find-password/api.test.ts
```

기대: 8개 모두 PASS.

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/find-password/api.ts mobile/lib/find-password/api.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile): 비밀번호 재설정 서버 호출 셋 (#838)

/auth/password/reset/send · /verify · PATCH /auth/password/reset.
가입과 주소가 다르다 — 보내는 값은 같은데 서버가 하는 일이 정반대라서다.

confirmPassword 를 함께 보낸다. 서버 DTO 가 셋 다 @NotBlank 라 빠뜨리면 400 이다.

소셜 계정을 가리는 곳은 classify() 한 군데뿐이다. 서버가 사유를 전부
code: 'BAD_REQUEST' 로 내려서 지금은 문구로 가릴 수밖에 없다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 값·단계·타이머를 들고 있는 훅

**Files:**
- Create: `mobile/lib/find-password/use-find-password.ts`
- Test: `mobile/lib/find-password/use-find-password.test.ts`

**Interfaces:**
- Consumes: Task 1의 `sendResetCode` · `verifyResetCode` · `resetPassword` · `PasswordResetRejectedError`, 그리고 `mobile/lib/signup/validation.ts`의 `validateEmail(value) => string | null` · `validatePassword(value) => string | null` · `validatePasswordConfirm(password, confirm) => string | null` · `passwordRules(value) => { length: boolean; composition: boolean }`
- Produces: `useFindPassword()` 가 돌려주는 것

```ts
{
  step: 1 | 2 | 3
  values: { email: string; code: string; password: string; passwordConfirm: string }
  errors: { email?: string; code?: string; password?: string; passwordConfirm?: string }
  formError: string | null
  socialBlocked: boolean
  secondsLeft: number
  sending: boolean
  verifying: boolean
  submitting: boolean
  passwordChecks: { length: boolean; composition: boolean }
  setValue: (key: 'email' | 'code' | 'password' | 'passwordConfirm', value: string) => void
  sendCode: () => Promise<void>
  submitCode: () => Promise<void>
  submitNewPassword: () => Promise<boolean>   // 성공하면 true. 화면이 그때 이동한다
  goPreviousStep: () => void
}
```

- [ ] **Step 1: 실패하는 시험을 쓴다**

`mobile/lib/find-password/use-find-password.test.ts`:

```ts
// 서버 호출 셋만 가짜로 바꾸고 PasswordResetRejectedError 는 진짜를 쓴다.
// 통째로 automock 하면 오류 클래스 생성자까지 빈 껍데기가 되어 reason·message 가 사라진다.
jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  sendResetCode: jest.fn(),
  verifyResetCode: jest.fn(),
  resetPassword: jest.fn(),
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as api from './api';
import { useFindPassword } from './use-find-password';

const mockedApi = api as jest.Mocked<typeof api>;

/** 1단계를 통과시켜 2단계로 보낸다. 여러 시험이 같은 준비를 쓴다. */
async function reachStep2(result: { current: ReturnType<typeof useFindPassword> }) {
  await act(async () => result.current.setValue('email', 'me@cuddle.com'));
  mockedApi.sendResetCode.mockResolvedValue(undefined);
  await act(async () => {
    await result.current.sendCode();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('1단계 — 인증코드 보내기', () => {
  it('이메일이 비면 서버를 부르지 않는다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await act(async () => {
      await result.current.sendCode();
    });
    expect(mockedApi.sendResetCode).not.toHaveBeenCalled();
    expect(result.current.errors.email).toBeTruthy();
    expect(result.current.step).toBe(1);
  });

  it('성공하면 2단계로 간다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await reachStep2(result);
    expect(result.current.step).toBe(2);
    expect(result.current.secondsLeft).toBeGreaterThan(0);
  });

  it('소셜 계정이면 1단계에 머물고 socialBlocked 가 켜진다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await act(async () => result.current.setValue('email', 'me@cuddle.com'));
    mockedApi.sendResetCode.mockRejectedValue(
      new api.PasswordResetRejectedError('소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.', 'social')
    );
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.step).toBe(1);
    expect(result.current.socialBlocked).toBe(true);
    expect(result.current.errors.email).toBe('소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.');
  });

  it('없는 이메일이면 1단계에 머물고 socialBlocked 는 꺼진 채다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await act(async () => result.current.setValue('email', 'nobody@cuddle.com'));
    mockedApi.sendResetCode.mockRejectedValue(
      new api.PasswordResetRejectedError('등록되지 않은 이메일입니다.', 'unknown')
    );
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.step).toBe(1);
    expect(result.current.socialBlocked).toBe(false);
    expect(result.current.errors.email).toBe('등록되지 않은 이메일입니다.');
  });
});

describe('2단계 — 코드 확인', () => {
  it('코드가 맞으면 3단계로 간다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await reachStep2(result);

    await act(async () => result.current.setValue('code', '123456'));
    mockedApi.verifyResetCode.mockResolvedValue(true);
    await act(async () => {
      await result.current.submitCode();
    });

    expect(result.current.step).toBe(3);
  });

  it('코드가 틀리면 2단계에 그대로 있는다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await reachStep2(result);

    await act(async () => result.current.setValue('code', '000000'));
    mockedApi.verifyResetCode.mockResolvedValue(false);
    await act(async () => {
      await result.current.submitCode();
    });

    expect(result.current.step).toBe(2);
    expect(result.current.errors.code).toBeTruthy();
  });

  it('재전송이 실패해도 2단계에 머문다 — 넣던 코드를 잃으면 안 된다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await reachStep2(result);

    mockedApi.sendResetCode.mockRejectedValue(new Error('네트워크'));
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.step).toBe(2);
  });
});

describe('3단계 — 새 비밀번호', () => {
  async function reachStep3(result: { current: ReturnType<typeof useFindPassword> }) {
    await reachStep2(result);
    await act(async () => result.current.setValue('code', '123456'));
    mockedApi.verifyResetCode.mockResolvedValue(true);
    await act(async () => {
      await result.current.submitCode();
    });
  }

  it('규칙에 어긋나면 서버를 부르지 않는다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await reachStep3(result);

    await act(async () => result.current.setValue('password', 'short'));
    await act(async () => result.current.setValue('passwordConfirm', 'short'));
    await act(async () => {
      await result.current.submitNewPassword();
    });

    expect(mockedApi.resetPassword).not.toHaveBeenCalled();
    expect(result.current.errors.password).toBeTruthy();
  });

  it('두 칸이 다르면 서버를 부르지 않는다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await reachStep3(result);

    await act(async () => result.current.setValue('password', 'Abcdef1!xy'));
    await act(async () => result.current.setValue('passwordConfirm', 'Abcdef1!zz'));
    await act(async () => {
      await result.current.submitNewPassword();
    });

    expect(mockedApi.resetPassword).not.toHaveBeenCalled();
    expect(result.current.errors.passwordConfirm).toBeTruthy();
  });

  it('성공하면 true 를 주고 셋을 그대로 서버에 보낸다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await reachStep3(result);

    await act(async () => result.current.setValue('password', 'Abcdef1!xy'));
    await act(async () => result.current.setValue('passwordConfirm', 'Abcdef1!xy'));
    mockedApi.resetPassword.mockResolvedValue(undefined);

    let ok = false;
    await act(async () => {
      ok = await result.current.submitNewPassword();
    });

    expect(ok).toBe(true);
    expect(mockedApi.resetPassword).toHaveBeenCalledWith({
      email: 'me@cuddle.com',
      newPassword: 'Abcdef1!xy',
      confirmPassword: 'Abcdef1!xy',
    });
  });
});

describe('뒤로', () => {
  it('2단계에서 뒤로 가면 1단계로 돌아가고 코드가 지워진다', async () => {
    const { result } = renderHook(() => useFindPassword());
    await reachStep2(result);
    await act(async () => result.current.setValue('code', '123456'));

    await act(async () => result.current.goPreviousStep());

    expect(result.current.step).toBe(1);
    expect(result.current.values.code).toBe('');
    expect(result.current.values.email).toBe('me@cuddle.com');
  });
});

describe('타이머', () => {
  it('5분이 지나면 2단계에서 1단계로 돌아간다', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useFindPassword());
    await reachStep2(result);

    act(() => {
      jest.advanceTimersByTime(300_000);
    });

    await waitFor(() => expect(result.current.step).toBe(1));
    jest.useRealTimers();
  });
});
```

- [ ] **Step 2: 시험이 실패하는지 확인한다**

```bash
cd mobile && npx jest lib/find-password/use-find-password.test.ts
```

기대: `Cannot find module './use-find-password'` 로 실패.

- [ ] **Step 3: 훅을 쓴다**

`mobile/lib/find-password/use-find-password.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  PasswordResetRejectedError,
  resetPassword,
  sendResetCode,
  verifyResetCode,
} from './api';
import {
  passwordRules,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '../signup/validation';

// 비밀번호 찾기의 값·단계·타이머를 전부 여기서 들고 있는다.
// 화면(app/find-password.tsx)은 이걸 어떻게 배치할지만 정한다 — 가입 화면과 같은 구조다.
//
// ⚠️ 단계를 미는 것은 **성공했을 때뿐이다.** 웹이 이걸 어겨서 버그가 났다(#836):
//    「시도했음」으로 단계를 넘겨서, 서버가 거절한 이메일에도 인증코드 칸이 떴다.

/** 서버 만료가 5분이라 그대로 맞춘다(EmailVerificationServiceImpl). */
const CODE_TTL_SECONDS = 300;

type FieldKey = 'email' | 'code' | 'password' | 'passwordConfirm';

const EMPTY_VALUES: Record<FieldKey, string> = {
  email: '',
  code: '',
  password: '',
  passwordConfirm: '',
};

export function useFindPassword() {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [socialBlocked, setSocialBlocked] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 화면이 사라진 뒤 setState 가 불리지 않게 정리한다.
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);
  useEffect(() => stopTimer, [stopTimer]);

  const startTimer = useCallback(() => {
    stopTimer();
    setSecondsLeft(CODE_TTL_SECONDS - 1); // 화면에 4:59부터 보이게 한다
    tickRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          // 코드가 만료되면 1단계로 돌린다. 만료된 코드를 계속 넣게 두면 헷갈린다.
          setStep(1);
          setValues((v) => ({ ...v, code: '' }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const setValue = useCallback((key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
    // 이메일을 고치면 「소셜 계정이라 막혔다」는 안내도 무효가 된다.
    if (key === 'email') setSocialBlocked(false);
  }, []);

  const sendCode = useCallback(async () => {
    const emailError = validateEmail(values.email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    const email = values.email.trim();
    setSending(true);
    setSocialBlocked(false);
    try {
      await sendResetCode(email);
      setStep(2);
      setValues((v) => ({ ...v, code: '' }));
      setErrors((prev) => ({ ...prev, code: undefined }));
      startTimer();
    } catch (error) {
      // 2단계에서 「재전송」이 실패한 경우에는 단계를 되돌리지 않는다.
      // 되돌리면 사용자가 넣고 있던 코드를 잃는다.
      if (error instanceof PasswordResetRejectedError) {
        setSocialBlocked(error.reason === 'social');
        setErrors((prev) => ({ ...prev, email: error.message }));
      } else {
        setErrors((prev) => ({
          ...prev,
          email: '인증코드 발송에 실패했어요. 잠시 후 다시 시도해주세요.',
        }));
      }
    } finally {
      setSending(false);
    }
  }, [values.email, startTimer]);

  const submitCode = useCallback(async () => {
    if (values.code.trim().length === 0) {
      setErrors((prev) => ({ ...prev, code: '전송된 코드를 입력해주세요' }));
      return;
    }

    setVerifying(true);
    try {
      const ok = await verifyResetCode(values.email.trim(), values.code.trim());
      if (!ok) {
        setErrors((prev) => ({ ...prev, code: '인증코드가 맞지 않아요. 다시 확인해주세요.' }));
        return;
      }
      stopTimer();
      setStep(3);
    } catch {
      setErrors((prev) => ({ ...prev, code: '인증코드 확인에 실패했어요. 잠시 후 다시 시도해주세요.' }));
    } finally {
      setVerifying(false);
    }
  }, [values.code, values.email, stopTimer]);

  const submitNewPassword = useCallback(async (): Promise<boolean> => {
    const passwordError = validatePassword(values.password);
    if (passwordError) {
      setErrors((prev) => ({ ...prev, password: passwordError }));
      return false;
    }
    const confirmError = validatePasswordConfirm(values.password, values.passwordConfirm);
    if (confirmError) {
      setErrors((prev) => ({ ...prev, passwordConfirm: confirmError }));
      return false;
    }

    setSubmitting(true);
    try {
      await resetPassword({
        email: values.email.trim(),
        newPassword: values.password,
        confirmPassword: values.passwordConfirm,
      });
      return true;
    } catch (error) {
      setFormError(
        error instanceof PasswordResetRejectedError
          ? error.message
          : '비밀번호 변경에 실패했어요. 잠시 후 다시 시도해주세요.'
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [values.email, values.password, values.passwordConfirm]);

  const goPreviousStep = useCallback(() => {
    stopTimer();
    setSecondsLeft(0);
    setErrors({});
    setFormError(null);
    setStep((prev) => {
      if (prev === 3) return 2;
      setValues((v) => ({ ...v, code: '' }));
      return 1;
    });
  }, [stopTimer]);

  return {
    step,
    values,
    errors,
    formError,
    socialBlocked,
    secondsLeft,
    sending,
    verifying,
    submitting,
    passwordChecks: passwordRules(values.password),
    setValue,
    sendCode,
    submitCode,
    submitNewPassword,
    goPreviousStep,
  };
}
```

- [ ] **Step 4: 시험이 통과하는지 확인한다**

```bash
cd mobile && npx jest lib/find-password/use-find-password.test.ts
```

기대: 11개 모두 PASS. 실패하면 훅을 고친다(시험을 고치지 말 것 — 시험이 설계다).

- [ ] **Step 5: 시험이 진짜로 잡는지 마커 검증**

`sendCode` 의 `catch` 안에 `setStep(2)` 를 **일부러 넣고** 다시 돌린다.

```bash
cd mobile && npx jest lib/find-password/use-find-password.test.ts
```

기대: 「소셜 계정이면 1단계에 머물고」·「없는 이메일이면 1단계에 머물고」 둘이 FAIL.
확인했으면 **되돌린다.**

- [ ] **Step 6: 커밋**

```bash
git add mobile/lib/find-password/use-find-password.ts mobile/lib/find-password/use-find-password.test.ts
git commit -m "$(cat <<'EOF'
feat(mobile): 비밀번호 찾기 훅 — 단계·타이머·검증 (#838)

단계를 미는 것은 **성공했을 때뿐이다.** 웹이 이걸 어겨 버그가 났다(#836) —
「시도했음」으로 넘겨서 서버가 거절한 이메일에도 인증코드 칸이 떴다.

재전송이 실패해도 2단계에 머문다. 되돌리면 넣고 있던 코드를 잃는다.
코드 만료 5분은 서버(EmailVerificationServiceImpl)에 맞췄고, 만료되면 1단계로 돌린다.

소셜 계정이면 socialBlocked 를 켠다 — 화면이 「로그인하러 가기」 길을 함께 준다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 단계 표시 조각

**Files:**
- Create: `mobile/components/find-password/step-indicator.tsx`

**Interfaces:**
- Produces: `<StepIndicator current={1 | 2 | 3} />`

- [ ] **Step 1: 조각을 쓴다**

`mobile/components/find-password/step-indicator.tsx`:

```tsx
import { StyleSheet, Text, View } from 'react-native';

// 1-2-3 진행 표시. 웹의 StepIndicator 와 같은 자리에 같은 뜻으로 둔다.
//
// ⚠️ 넣을지 뺄지는 실기기에서 보고 정하기로 했다(설계 §3). 화면에서 한 줄만 지우면
//    빠지도록 이 조각 하나에 가둬 뒀다.

const LABELS = ['이메일', '인증', '새 비밀번호'];

const DONE = '#111827';
const PENDING = '#D1D5DB';  // 아직 안 지나온 단계

interface Props {
  current: 1 | 2 | 3;
}

export function StepIndicator({ current }: Props) {
  return (
    <View style={styles.row}>
      {LABELS.map((label, index) => {
        const step = index + 1;
        const reached = step <= current;
        return (
          <View key={label} style={styles.item}>
            {index > 0 ? <View style={[styles.line, reached && styles.lineDone]} /> : null}
            <View style={[styles.dot, reached && styles.dotDone]}>
              <Text style={[styles.number, reached && styles.numberDone]}>{step}</Text>
            </View>
            <Text style={[styles.label, reached && styles.labelDone]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  line: { width: 20, height: 1, backgroundColor: PENDING },
  lineDone: { backgroundColor: DONE },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PENDING,
  },
  dotDone: { backgroundColor: DONE },
  number: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  numberDone: { color: '#FFFFFF' },
  label: { fontSize: 12, color: '#9CA3AF' },
  labelDone: { color: '#111827', fontWeight: '600' },
});
```

- [ ] **Step 2: 타입이 맞는지 확인한다**

```bash
pnpm gate:mobile
```

기대: EXIT=0.

- [ ] **Step 3: 커밋**

```bash
git add mobile/components/find-password/step-indicator.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): 비밀번호 찾기 단계 표시 조각 (#838)

웹 StepIndicator 와 같은 자리에 같은 뜻으로 둔다. 넣을지 뺄지는 실기기에서
보고 정하기로 해서(설계 §3), 화면에서 한 줄만 지우면 빠지도록 조각에 가둬 뒀다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 화면

**Files:**
- Create: `mobile/app/find-password.tsx`

**Interfaces:**
- Consumes: Task 2의 `useFindPassword()`, Task 3의 `<StepIndicator current={...} />`, `@/components/signup/field` 의 `<Field label value onChangeText placeholder error hint trailing />`, `@/components/signup/password-checklist` 의 `<PasswordChecklist checks visible />`, `@/lib/toast` 의 `showToast(message)`
- Produces: expo-router 경로 `/find-password`

- [ ] **Step 1: 화면을 쓴다**

`mobile/app/find-password.tsx`:

```tsx
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepIndicator } from '@/components/find-password/step-indicator';
import { Field } from '@/components/signup/field';
import { PasswordChecklist } from '@/components/signup/password-checklist';
import { useFindPassword } from '@/lib/find-password/use-find-password';
import { showToast } from '@/lib/toast';

// 비밀번호 찾기. 한 화면 안에서 3단계로 간다 — 웹도 주소 하나에서 이렇게 한다.
//
// 앞 단계 값은 칸으로 남기지 않고 **헤더 문구**로 알린다(웹과 같은 방식).
// 헤더를 직접 그리는 이유는 로그인 화면과 같다: native-stack 헤더에는 상단 인셋
// 옵션이 없어 실기기에서 상태바와 붙어 보인다.

const HEADER_HEIGHT = 52;

/** 남은 시간을 4:59 꼴로. 가입 화면의 mmss 와 같은 규칙이다. */
function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function FindPasswordScreen() {
  const router = useRouter();
  const form = useFindPassword();

  const close = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/(home)');
    }
  };

  const handleBack = () => {
    if (form.step === 1) {
      close();
      return;
    }
    form.goPreviousStep();
  };

  const handleSubmitNewPassword = async () => {
    const ok = await form.submitNewPassword();
    if (!ok) return;
    showToast('비밀번호를 바꿨어요. 새 비밀번호로 로그인해주세요.');
    // replace — 뒤로가기로 방금 끝낸 재설정 화면에 돌아오면 안 된다
    router.replace('/email-login');
  };

  const headline =
    form.step === 3
      ? { title: '새 비밀번호', desc: '새로 쓸 비밀번호를 입력해주세요' }
      : form.step === 2
        ? { title: '이메일 인증', desc: `${form.values.email}로 인증코드를 보냈어요` }
        : { title: '이메일 입력', desc: '가입하신 이메일을 입력하면 인증코드를 보내드려요' };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="뒤로"
          style={({ pressed }) => (pressed ? styles.backPressed : undefined)}
        >
          <ChevronLeft size={26} color="#111827" />
        </Pressable>

        <View style={styles.headerTitleBox} pointerEvents="none">
          <Text style={styles.headerTitle}>비밀번호 찾기</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* 이 한 줄이 단계 표시다. 빼기로 하면 여기만 지운다(설계 §3) */}
          <StepIndicator current={form.step} />

          <View style={styles.headline}>
            <Text style={styles.headlineTitle}>{headline.title}</Text>
            <Text style={styles.headlineDesc}>{headline.desc}</Text>
          </View>

          {form.step === 1 ? (
            <View style={styles.group}>
              <Field
                label="이메일 주소"
                value={form.values.email}
                onChangeText={(text) => form.setValue('email', text)}
                placeholder="example@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={form.errors.email}
              />

              {form.socialBlocked ? (
                <View style={styles.socialBox}>
                  <Text style={styles.socialText}>
                    카카오·구글로 가입한 계정이에요.{'\n'}그 방법으로 로그인해주세요.
                  </Text>
                  <Pressable
                    onPress={() => router.replace('/login')}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.socialButtonLabel}>로그인하러 가기</Text>
                  </Pressable>
                </View>
              ) : null}

              <Pressable
                onPress={() => void form.sendCode()}
                disabled={form.sending}
                accessibilityRole="button"
                style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
              >
                {form.sending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitLabel}>인증코드 받기</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {form.step === 2 ? (
            <View style={styles.group}>
              <Field
                label="인증코드"
                value={form.values.code}
                onChangeText={(text) => form.setValue('code', text)}
                placeholder="6자리 인증코드 입력"
                keyboardType="number-pad"
                maxLength={6}
                error={form.errors.code}
                hint={form.secondsLeft > 0 ? `남은 시간 ${mmss(form.secondsLeft)}` : undefined}
                hintTone={form.secondsLeft > 0 && form.secondsLeft <= 60 ? 'danger' : 'muted'}
              />

              <Pressable
                onPress={() => void form.submitCode()}
                disabled={form.verifying}
                accessibilityRole="button"
                style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
              >
                {form.verifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitLabel}>확인</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => void form.sendCode()}
                disabled={form.sending}
                accessibilityRole="button"
                hitSlop={8}
                style={({ pressed }) => (pressed ? styles.pressed : undefined)}
              >
                <Text style={styles.linkText}>인증코드 다시 받기</Text>
              </Pressable>
            </View>
          ) : null}

          {form.step === 3 ? (
            <View style={styles.group}>
              <Field
                label="새 비밀번호"
                value={form.values.password}
                onChangeText={(text) => form.setValue('password', text)}
                placeholder="비밀번호를 입력해주세요"
                secureTextEntry
                autoCapitalize="none"
                error={form.errors.password}
              />
              <PasswordChecklist
                checks={form.passwordChecks}
                visible={form.values.password.length > 0 || Boolean(form.errors.password)}
              />

              <Field
                label="새 비밀번호 확인"
                value={form.values.passwordConfirm}
                onChangeText={(text) => form.setValue('passwordConfirm', text)}
                placeholder="비밀번호를 다시 입력해주세요"
                secureTextEntry
                autoCapitalize="none"
                error={form.errors.passwordConfirm}
              />

              {form.formError ? <Text style={styles.formError}>{form.formError}</Text> : null}

              <Pressable
                onPress={() => void handleSubmitNewPassword()}
                disabled={form.submitting}
                accessibilityRole="button"
                style={({ pressed }) => [styles.submit, pressed && styles.pressed]}
              >
                {form.submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitLabel}>비밀번호 변경</Text>
                )}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitleBox: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  backPressed: { opacity: 0.5 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 24 },
  headline: { gap: 6 },
  headlineTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headlineDesc: { fontSize: 14, color: '#6B7280' },
  group: { gap: 16 },
  submit: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
  },
  submitLabel: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  pressed: { opacity: 0.8 },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  formError: { fontSize: 13, fontWeight: '600', color: '#C91D1D' },
  // 소셜 계정이라 막혔을 때. 「안 된다」로 끝내지 않고 갈 길을 함께 준다
  socialBox: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 14, gap: 10 },
  socialText: { fontSize: 13, lineHeight: 19, color: '#374151' },
  socialButton: {
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4E3BF',
  },
  socialButtonLabel: { fontSize: 14, fontWeight: '600', color: '#633F00' },
});
```

- [ ] **Step 2: 게이트를 돌린다**

```bash
pnpm gate:mobile
```

기대: EXIT=0. `KeyboardAvoidingView` 에 `behavior="padding"` 을 **양쪽 다** 준 것을 확인할 것 — `Platform.OS === 'ios' ? 'padding' : undefined` 로 두면 안드로이드에서 아무 일도 일어나지 않는다(`mobile/AGENTS.md`).

- [ ] **Step 3: 커밋**

```bash
git add mobile/app/find-password.tsx
git commit -m "$(cat <<'EOF'
feat(mobile): 비밀번호 찾기 화면 (#838)

한 화면 3단계 — 이메일 → 인증코드 → 새 비밀번호. 웹도 주소 하나에서 이렇게 한다.
앞 단계 값은 칸으로 남기지 않고 헤더 문구로 알린다(웹과 같은 방식).

소셜 계정이라 막히면 「안 된다」로 끝내지 않고 「로그인하러 가기」를 함께 준다.
여기 온 사람은 대개 카카오로 가입한 걸 잊고 헤매다 온 사람이다.

성공하면 이메일 로그인 화면으로 replace + 토스트. push 로 가면 뒤로가기로
방금 끝낸 화면에 돌아온다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: 진입점 둘 + 웹 링크 상수 정리

**Files:**
- Modify: `mobile/app/login.tsx` (아래 링크 줄)
- Modify: `mobile/components/auth/login-form.tsx` (비밀번호 칸 아래)
- Modify: `mobile/lib/support-links.ts` (`FIND_PASSWORD_URL` 삭제)

**Interfaces:**
- Consumes: Task 4의 경로 `/find-password`

- [ ] **Step 1: 관문의 링크를 라우트로 바꾼다**

`mobile/app/login.tsx` — 아래 링크 줄의 「비밀번호 찾기」를 고친다.

```tsx
// 전
<Pressable
  onPress={() => void Linking.openURL(FIND_PASSWORD_URL)}
  accessibilityRole="link"
  ...
>

// 후
<Pressable
  onPress={() => router.push('/find-password')}
  accessibilityRole="button"
  ...
>
```

같은 파일에서 쓰지 않게 된 것을 지운다:
- `import { Linking } from 'react-native'` 의 `Linking` (다른 데서 안 쓰면)
- `import { FIND_PASSWORD_URL } from '@/lib/support-links'`

그리고 그 위 주석에서 「앱에는 비밀번호 찾기 화면이 없어 웹 페이지를 연다」를 지우고 이렇게 바꾼다:

```tsx
{/* 화면 맨 아래 보조 링크 두 줄기. 단추(로그인하는 길)와 달리 「다른 데로 가는 길」이라
    한 줄에 모아 둔다 — 사이의 세로 막대가 둘을 가른다.

    「비밀번호 찾기」는 #838에서 앱 안 화면이 생겨 웹으로 내보내지 않는다.
    문구는 그 화면의 제목과 같은 말이다. */}
```

- [ ] **Step 2: 이메일 로그인 폼에 링크를 넣는다**

`mobile/components/auth/login-form.tsx` — 비밀번호 칸(`</View>`)과 `{error ? ... : null}` 사이에 넣는다.

```tsx
      {/* 웹도 비밀번호 칸 아래에 같은 링크를 둔다(LoginForm.tsx).
          비밀번호를 떠올리지 못했을 때 빠져나갈 길은 비밀번호를 치는 자리 옆에 있어야 한다. */}
      <Pressable
        onPress={() => router.push('/find-password')}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed }) => (pressed ? styles.findPasswordPressed : undefined)}
      >
        <Text style={styles.findPassword}>비밀번호를 잊으셨나요?</Text>
      </Pressable>
```

`styles` 에 더한다:

```tsx
  findPassword: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    textDecorationLine: 'underline',
  },
  findPasswordPressed: { opacity: 0.6 },
```

파일 맨 위에 `import { useRouter } from 'expo-router';` 가 없으면 더하고, 컴포넌트 안에 `const router = useRouter();` 를 더한다.

- [ ] **Step 3: 쓰지 않게 된 상수를 지운다**

`mobile/lib/support-links.ts` 에서 `FIND_PASSWORD_URL` 블록(주석 포함)을 통째로 지운다.

- [ ] **Step 4: 잔재가 없는지 확인한다**

```bash
grep -rn "FIND_PASSWORD_URL" mobile/ | grep -v node_modules
```

기대: 결과 없음.

- [ ] **Step 5: 게이트를 돌린다**

```bash
pnpm gate:mobile
```

기대: EXIT=0. 쓰지 않는 import 가 남아 있으면 lint 경고가 늘어난다 — 상한 그대로여야 한다.

- [ ] **Step 6: 커밋**

```bash
git add mobile/app/login.tsx mobile/components/auth/login-form.tsx mobile/lib/support-links.ts
git commit -m "$(cat <<'EOF'
feat(mobile): 비밀번호 찾기로 가는 길 둘 (#838)

관문 아래 링크가 웹 페이지를 열던 것을 앱 안 화면으로 바꾼다(#829에서 링크만
먼저 살려 뒀던 것이다). 이메일 로그인 화면의 비밀번호 칸 아래에도 넣는다 —
비밀번호를 떠올리지 못했을 때 빠져나갈 길은 비밀번호를 치는 자리 옆에 있어야 한다.
웹도 그 자리에 둔다.

화면이 생겨 쓸 데가 없어진 FIND_PASSWORD_URL 을 지운다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 웹 — 소셜 안내와 성공 알림

**Files:**
- Modify: `src/features/find-password/components/FindPasswordForm.tsx`
- Test: `src/features/find-password/components/FindPasswordForm.test.tsx` (이미 있다 · #836에서 만들었다)

**Interfaces:**
- Consumes: 이미 있는 `sendValidCode` · `reSettingPassword` · `ROUTES.LOGIN`

- [ ] **Step 1: 실패하는 시험을 쓴다**

`FindPasswordForm.test.tsx` 맨 아래에 더한다. (파일 위쪽의 기존 mock·헬퍼를 그대로 쓴다.)

```tsx
describe('소셜 계정 안내', () => {
  it('소셜 계정이면 「로그인하러 가기」 길을 함께 준다', async () => {
    mockedSendValidCode.mockRejectedValue(
      makeAxiosError(400, '소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다.')
    );

    render(<FindPasswordForm />)
    await userEvent.type(screen.getByPlaceholderText('이메일 (example@cuddle.com)'), 'me@cuddle.com')
    await userEvent.click(screen.getByRole('button', { name: '인증코드 전송' }))

    expect(await screen.findByText(/카카오·구글로 가입한 계정/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '로그인하러 가기' })).toHaveAttribute('href', '/auth/login')
  })

  it('그냥 없는 이메일이면 그 안내는 뜨지 않는다', async () => {
    mockedSendValidCode.mockRejectedValue(makeAxiosError(400, '등록되지 않은 이메일입니다.'))

    render(<FindPasswordForm />)
    await userEvent.type(screen.getByPlaceholderText('이메일 (example@cuddle.com)'), 'nobody@cuddle.com')
    await userEvent.click(screen.getByRole('button', { name: '인증코드 전송' }))

    expect(await screen.findByText('등록되지 않은 이메일입니다.')).toBeInTheDocument()
    expect(screen.queryByText(/카카오·구글로 가입한 계정/)).not.toBeInTheDocument()
  })
})

describe('성공 알림', () => {
  it('비밀번호를 바꾸면 바꿨다고 알린다', async () => {
    // 3단계까지 간 상태를 만든다 (파일 위쪽 헬퍼 reachStep3 를 쓴다)
    await reachStep3()
    mockedReSettingPassword.mockResolvedValue({ data: null })

    await userEvent.type(screen.getByPlaceholderText('새 비밀번호'), 'Abcdef1!xy')
    await userEvent.type(screen.getByPlaceholderText('새 비밀번호 확인'), 'Abcdef1!xy')
    await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경 완료' }))

    expect(await screen.findByText(/비밀번호를 바꿨어요/)).toBeInTheDocument()
  })
})
```

⚠️ 위 시험이 쓰는 `makeAxiosError` · `reachStep3` · `mockedSendValidCode` · `mockedReSettingPassword` 이름은 **기존 파일에 있는 것을 그대로 쓴다.** 파일을 먼저 읽고, 이름이 다르면 그 파일의 이름에 맞춘다. 없으면 그 파일의 방식대로 만든다. 플레이스홀더가 아니라 실제 이름을 확인하고 쓸 것.

- [ ] **Step 2: 시험이 실패하는지 확인한다**

```bash
npx vitest run src/features/find-password/components/FindPasswordForm.test.tsx
```

기대: 새로 넣은 3개가 FAIL.

- [ ] **Step 3: 소셜 안내를 넣는다**

`FindPasswordForm.tsx` 1단계 블록에서, 이메일 `InputField` 아래에 더한다.

```tsx
{/* 서버가 막았을 때 「안 된다」로 끝내지 않고 갈 길을 준다.
    여기 온 사람은 대개 카카오·구글로 가입한 걸 잊고 이메일 로그인을 하려다 온 사람이다.
    앱도 같은 안내를 한다(#838). */}
{sendValidCodeResult.status === 'error' && sendValidCodeResult.message.includes('소셜') ? (
  <div className="bg-surface-container-low flex flex-col gap-3 rounded-lg p-4">
    <p className="text-sm text-gray-700">
      카카오·구글로 가입한 계정이에요.
      <br />그 방법으로 로그인해주세요.
    </p>
    <Link
      href={ROUTES.LOGIN}
      className="bg-primary-100 text-primary rounded-lg px-4 py-2 text-center text-sm font-semibold"
    >
      로그인하러 가기
    </Link>
  </div>
) : null}
```

- [ ] **Step 4: 성공 알림을 넣는다**

같은 파일에 상태를 더한다.

```tsx
const [resetDone, setResetDone] = useState(false)
```

`onReSettingPassword` 의 성공 자리에서 켠다.

```tsx
await reSettingPassword({ ... })
setResetDone(true)          // ← 1.5초 동안 이 문구가 보인다
setTimeout(() => {
  router.push(ROUTES.LOGIN)
}, 1500)
```

3단계 블록의 「비밀번호 변경 완료」 단추 위에 문구를 놓는다.

```tsx
{/* 1.5초 뒤 로그인 화면으로 넘어간다. 그동안 아무 말도 없으면 「눌렀는데 멈췄다」로 보인다.
    앱은 토스트로 같은 말을 한다(#838). */}
{resetDone ? (
  <p className="text-success-500 text-sm font-semibold">
    비밀번호를 바꿨어요. 새 비밀번호로 로그인해주세요.
  </p>
) : null}
```

- [ ] **Step 5: 시험이 통과하는지 확인한다**

```bash
npx vitest run src/features/find-password/components/FindPasswordForm.test.tsx
```

기대: 기존 9개 + 새 3개 = 12개 PASS.

- [ ] **Step 6: 웹 게이트를 돌린다**

```bash
pnpm gate
```

기대: EXIT=0 · lint 경고 36 그대로.

- [ ] **Step 7: 커밋**

```bash
git add src/features/find-password/
git commit -m "$(cat <<'EOF'
fix(web): 소셜 계정 안내와 성공 알림을 채운다 (#838)

① 소셜 계정 — 「소셜 로그인 사용자는 비밀번호 재설정이 불가능합니다」 한 줄이 전부였다.
   여기 온 사람은 대개 카카오로 가입한 걸 잊고 헤매다 온 사람이라, 다음에 뭘 해야
   할지 알려줘야 한다. 안내와 「로그인하러 가기」를 함께 준다. 앱도 같은 안내를 한다.

② 성공 알림 — 비밀번호를 바꿔도 **아무 말 없이** 1.5초 멈췄다 로그인 화면으로 갔다.
   1.5초는 메시지를 보여주려던 자리로 보이는데 정작 메시지가 없었다. 사용자에겐
   「눌렀는데 멈췄다가 갑자기 화면이 바뀐」 것으로 보인다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: 실기기 확인과 단계 표시 결정

**Files:** 없음(확인만). 결정에 따라 `mobile/app/find-password.tsx` 한 줄

- [ ] **Step 1: 앱을 띄운다**

```bash
cd mobile && pnpm expo start --dev-client
```

⚠️ 화면이 옛것이면 코드를 뒤지기 전에 **폰에서 Reload**(흔들기 → Reload). Metro 가 다시 떠도 폰은 저절로 안 붙는다.

- [ ] **Step 2: 다섯 갈래를 눈으로 확인한다**

```
① 관문 아래 「비밀번호 찾기」 → 앱 안 화면이 열린다 (브라우저가 아니다)
② 이메일 로그인 화면의 비밀번호 칸 아래 링크 → 같은 화면이 열린다
③ 소셜로 가입한 이메일 → 1단계에 머물고 「로그인하러 가기」가 보인다
④ 정상 이메일 → 코드가 오고, 2단계에서 남은 시간이 줄어든다. 코드를 틀리면 2단계에 그대로
⑤ 새 비밀번호 변경 성공 → 이메일 로그인 화면으로 가고 토스트가 뜬다.
   거기서 뒤로가기 → 재설정 화면으로 **돌아오지 않는다**
```

- [ ] **Step 3: 단계 표시를 뺀 모습과 비교한다**

`app/find-password.tsx` 에서 `<StepIndicator current={form.step} />` 한 줄을 주석 처리하고 Reload 해서 나란히 본다. **사용자가 최종 결정한다.**

- [ ] **Step 4: 결정을 반영하고 커밋**

넣기로 하면 그대로 두고, 빼기로 하면 그 한 줄과 `step-indicator.tsx` 를 지운다.

```bash
git add -A && git commit -m "$(cat <<'EOF'
feat(mobile): 단계 표시 최종 결정 (#838)

실기기에서 넣은 모습과 뺀 모습을 나란히 보고 정했다.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: 전체 게이트 + PR**

```bash
pnpm gate:all      # shared → mobile → 웹
git push -u origin feature/838--app-find-password
```

PR 은 base `develop`, 본문은 저장소 템플릿(`📌 개요 / 🔧 작업 내용 / 📎 관련 이슈 / 📸 스크린샷 / 💬 리뷰어 참고 사항`), `Close #838`.

스크린샷 절에 **단계 표시 넣은 것/뺀 것**과 **소셜 계정 안내**를 넣는다.

---

## 자기 점검 (계획을 쓴 뒤 확인한 것)

| 설계 문서 | 어느 Task |
| --- | --- |
| §1 뼈대(화면/훅/api 셋) | Task 1·2·4 |
| §2 재사용/새로 쓰기 | Task 1·2·4 (`Field`·`PasswordChecklist`·검증 함수 재사용) |
| §3 한 화면 3단계·헤더 문구·단계 표시 | Task 3·4 |
| §4 서버 주소 셋·`confirmPassword` | Task 1 (시험이 본문을 못 박는다) |
| §5 어긋났을 때 | Task 1·2 (오류 갈래) · Task 4 (표시) |
| §6 소셜 계정 — 앱·웹 | Task 4(앱) · Task 6(웹) |
| §7 성공한 뒤 — 앱·웹 | Task 4(앱 replace+토스트) · Task 6(웹 알림) |
| §8 진입점 둘 + 상수 정리 | Task 5 |
| §9 시험 | Task 1·2 (앱) · Task 6 (웹) |
| §10 안 하는 것 | 어느 Task 에도 없음 (의도한 것) |
| §11 함정 다섯 | Task 1 주석(주소·confirmPassword) · Task 2 주석(단계 전진·만료 5분) · Task 4 게이트 단계(KeyboardAvoidingView) |
