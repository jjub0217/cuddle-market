# 앱 이메일 회원가입 구현 계획 (#798)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱에서 이메일로 회원가입할 수 있게 만들고, 가입 인증을 서버에서도 강제한다.

**Architecture:** 입력칸·검증·API를 한 벌로 만들고, 그 위에 화면 배치만 다른 두 벌(A안 한 화면 / B안 2단계)을 얹는다. 실기기로 비교해 하나를 고르고 나머지를 지운다. 백엔드는 이미 있는 검사 코드를 `signUp()`으로 옮기고, 웹은 인증 상태를 푸는 한 줄을 더한다.

**Tech Stack:** Expo SDK 54 · React Native · TypeScript · Zustand · TanStack Query · Jest(jest-expo) / Spring Boot(별도 저장소) / Next.js 웹

**설계 스펙:** `docs/superpowers/specs/2026-07-31-rn-signup-design.md`

---

## Global Constraints

- **Expo SDK 54 고정.** 새 네이티브 모듈을 넣지 않는다 — Expo Go에서 A·B를 비교해야 한다
- **폼 라이브러리를 새로 들이지 않는다.** 앱은 지금 손으로 검증한다(`login-form.tsx`)
- **검증 규칙은 웹을 따른다** (§4). 앱이 새로 정하지 않는다
- 비밀번호 **10~30자** + 영문 대문자·소문자·숫자·특수문자 `!@#$%^&*()` 모두 포함
- 이름 **2~10자** · 닉네임 **2~10자** · 거주지 **필수** · 생년월일 **만 14세 이상**
- 인증코드 만료 **5분** → 타이머는 `4:59`부터
- 닉네임 확인 버튼 문구는 **「중복체크」** (웹과 같게)
- 백엔드 저장소(`~/Desktop/cmarket_api`)는 **`main`에 직접 커밋**한다 (전역 규칙의 예외)
- 백엔드는 이 맥에서 **컴파일 불가**(JDK 11, 프로젝트는 21). 푸시 후 EC2 빌드 로그로 확인한다
- 게이트: 앱 `npx tsc --noEmit && npx expo lint && npx jest` / 웹 `npx tsc --noEmit` + 바뀐 파일 eslint

---

## File Structure

### 새로 만드는 것 (앱)

| 파일 | 책임 |
|---|---|
| `mobile/constants/cities.ts` | 시/도 · 구/군 목록 (웹 `src/constants/cities.ts`를 그대로 옮김) |
| `mobile/lib/signup/validation.ts` | 순수 검증 함수들. 화면을 모른다 |
| `mobile/lib/signup/validation.test.ts` | 위 테스트 |
| `mobile/lib/signup/api.ts` | 가입 관련 서버 호출 5개 |
| `mobile/lib/signup/api.test.ts` | 위 테스트 |
| `mobile/lib/signup/use-signup-form.ts` | 폼 상태와 제출. **두 안이 공유한다** |
| `mobile/lib/signup/use-signup-form.test.ts` | 위 테스트 |
| `mobile/components/signup/email-verification.tsx` | 인증 영역 3상태 + 타이머 |
| `mobile/components/signup/field.tsx` | 라벨 + 입력칸 + 오류문구 한 벌 |
| `mobile/components/signup/birth-date-field.tsx` | YYYY / MM / DD 세 칸 |
| `mobile/components/signup/address-field.tsx` | 시/도 · 구/군 두 단계 선택 |
| `mobile/app/signup.tsx` | **A안** — 한 화면 |
| `mobile/app/signup-b.tsx` | **B안** — 2단계 |

### 고치는 것

| 파일 | 무엇 |
|---|---|
| `mobile/app/login.tsx` | 비교용 임시 버튼 두 개 (마지막에 지운다) |
| `~/Desktop/cmarket_api/.../AuthServiceImpl.java` | 인증 확인 추가 + `System.out.println` 삭제 |
| `src/features/signup/components/EmailValidCode.tsx` | 이메일이 바뀌면 인증 상태 풀기 |

### 왜 이렇게 나누나

`use-signup-form.ts`가 **값·오류·서버 호출을 전부 들고 있고**, 화면(`signup.tsx`·`signup-b.tsx`)은 그걸 어떻게 배치할지만 정한다. 그래서 A안과 B안이 로직을 공유하고, 비교가 끝나면 화면 파일 하나만 지우면 된다.

---

## Task 1: 검증 함수와 시/도 목록

**Files:**
- Create: `mobile/constants/cities.ts`
- Create: `mobile/lib/signup/validation.ts`
- Test: `mobile/lib/signup/validation.test.ts`

**Interfaces:**
- Produces:
  - `PROVINCES: readonly string[]`, `CITIES: Record<string, readonly string[]>`
  - `validateEmail(v: string): string | null`
  - `validatePassword(v: string): string | null`
  - `validatePasswordConfirm(pw: string, confirm: string): string | null`
  - `validateName(v: string): string | null`
  - `validateNickname(v: string): string | null`
  - `validateBirthDate(y: string, m: string, d: string): string | null`
  - `formatBirthDate(y: string, m: string, d: string): string` — `YYYY-MM-DD`
  - 모든 `validate*`는 **문제없으면 `null`**, 있으면 사용자에게 보일 한국어 문구를 돌려준다

- [ ] **Step 1: 시/도 목록을 옮긴다**

```bash
cp src/constants/cities.ts mobile/constants/cities.ts
```

옮긴 뒤 파일 맨 위 주석을 이렇게 바꾼다. 웹 것과 같은 내용임을 남겨 둔다.

```ts
// 웹 src/constants/cities.ts를 그대로 옮긴 것.
// 웹에서 이 목록이 바뀌면 여기도 같이 바꿔야 한다.
```

웹 파일이 `Province` 타입을 export 하면 그것도 함께 온다. 앱에서 안 쓰면 지운다.

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`mobile/lib/signup/validation.test.ts`

```ts
import {
  formatBirthDate,
  validateBirthDate,
  validateEmail,
  validateName,
  validateNickname,
  validatePassword,
  validatePasswordConfirm,
} from './validation';

describe('validateEmail', () => {
  it('형식이 맞으면 null', () => {
    expect(validateEmail('me@cuddle.com')).toBeNull();
  });
  it('@가 없으면 문구를 돌려준다', () => {
    expect(validateEmail('mecuddle.com')).toBe('이메일 형식이 올바르지 않습니다');
  });
  it('비어 있으면 문구를 돌려준다', () => {
    expect(validateEmail('')).toBe('이메일을 입력해주세요');
  });
});

describe('validatePassword', () => {
  it('네 종류를 다 갖추고 10자 이상이면 null', () => {
    expect(validatePassword('Abcdef1!xy')).toBeNull();
  });
  it('9자면 길이 문구', () => {
    expect(validatePassword('Abcde1!xy')).toBe('비밀번호는 최소 10자 이상이어야 합니다');
  });
  it('31자면 길이 문구', () => {
    expect(validatePassword('Abcdef1!' + 'x'.repeat(23))).toBe(
      '비밀번호는 최대 30자까지 가능합니다'
    );
  });
  it('특수문자가 없으면 구성 문구', () => {
    expect(validatePassword('Abcdefg1xy')).toBe(
      '영문 대소문자, 숫자, 특수문자를 모두 포함해야 합니다'
    );
  });
});

describe('validatePasswordConfirm', () => {
  it('같으면 null', () => {
    expect(validatePasswordConfirm('Abcdef1!xy', 'Abcdef1!xy')).toBeNull();
  });
  it('다르면 문구', () => {
    expect(validatePasswordConfirm('Abcdef1!xy', 'Abcdef1!xz')).toBe(
      '비밀번호가 일치하지 않습니다'
    );
  });
});

describe('validateName / validateNickname', () => {
  it('2~10자면 null', () => {
    expect(validateName('강주현')).toBeNull();
    expect(validateNickname('주현')).toBeNull();
  });
  it('1자면 문구', () => {
    expect(validateName('강')).toBe('이름은 2~10자 이하이어야 합니다.');
    expect(validateNickname('주')).toBe('닉네임은 2~10자 이하이어야 합니다.');
  });
  it('11자면 문구', () => {
    expect(validateName('가'.repeat(11))).toBe('이름은 2~10자 이하이어야 합니다.');
  });
});

describe('validateBirthDate', () => {
  // 오늘을 고정한다. 안 그러면 만 14세 경계 테스트가 내년에 깨진다.
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-31T00:00:00+09:00'));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('만 14세를 하루 넘겼으면 null', () => {
    expect(validateBirthDate('2012', '07', '30')).toBeNull();
  });
  it('생일 당일이면 null (만 14세가 된 날)', () => {
    expect(validateBirthDate('2012', '07', '31')).toBeNull();
  });
  it('생일 하루 전이면 문구', () => {
    expect(validateBirthDate('2012', '08', '01')).toBe('만 14세 이상만 가입할 수 있습니다');
  });
  it('없는 날짜면 문구', () => {
    expect(validateBirthDate('2012', '02', '31')).toBe('생년월일을 확인해주세요');
  });
  it('비어 있으면 문구', () => {
    expect(validateBirthDate('', '', '')).toBe('생년월일을 입력해주세요');
  });
});

describe('formatBirthDate', () => {
  it('한 자리도 0을 채워 YYYY-MM-DD로 만든다', () => {
    expect(formatBirthDate('2000', '3', '7')).toBe('2000-03-07');
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 본다**

```bash
cd mobile && npx jest lib/signup/validation.test.ts
```

기대: `Cannot find module './validation'`로 실패한다.

- [ ] **Step 4: 검증 함수를 만든다**

`mobile/lib/signup/validation.ts`

```ts
// 회원가입 입력 검증. 화면을 모르는 순수 함수라 테스트가 쉽다.
//
// 규칙 값은 전부 웹에서 가져왔다 — 앱이 새로 정하면 웹 가입자와 앱 가입자의
// 계정 규격이 갈린다.
//   이메일·비밀번호  src/lib/utils/validation/authValidationRules.ts
//   이름·닉네임      src/features/signup/validationRules.ts
//   만 14세          백엔드 AuthServiceImpl.validateAge

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// 대문자·소문자·숫자·특수문자를 각각 하나씩은 갖춰야 한다. 웹과 같은 정규식이다.
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()]).+$/;

const MIN_AGE = 14;

export function validateEmail(value: string): string | null {
  if (value.trim().length === 0) return '이메일을 입력해주세요';
  if (!EMAIL_PATTERN.test(value.trim())) return '이메일 형식이 올바르지 않습니다';
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length === 0) return '비밀번호를 입력해주세요';
  if (value.length < 10) return '비밀번호는 최소 10자 이상이어야 합니다';
  if (value.length > 30) return '비밀번호는 최대 30자까지 가능합니다';
  if (!PASSWORD_PATTERN.test(value)) {
    return '영문 대소문자, 숫자, 특수문자를 모두 포함해야 합니다';
  }
  return null;
}

export function validatePasswordConfirm(password: string, confirm: string): string | null {
  if (confirm.length === 0) return '비밀번호 확인을 입력해주세요';
  if (password !== confirm) return '비밀번호가 일치하지 않습니다';
  return null;
}

/** 이름과 닉네임은 규칙이 같아 한 함수로 만들고 문구만 바꿔 쓴다. */
function validateLength2to10(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return `${label}을 입력해주세요`;
  if (trimmed.length < 2 || trimmed.length > 10) {
    return `${label}은 2~10자 이하이어야 합니다.`;
  }
  return null;
}

export function validateName(value: string): string | null {
  return validateLength2to10(value, '이름');
}

export function validateNickname(value: string): string | null {
  return validateLength2to10(value, '닉네임');
}

/** 세 칸을 0으로 채워 붙인다. 서버는 YYYY-MM-DD만 받는다. */
export function formatBirthDate(year: string, month: string, day: string): string {
  return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function validateBirthDate(year: string, month: string, day: string): string | null {
  if (!year || !month || !day) return '생년월일을 입력해주세요';

  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return '생년월일을 확인해주세요';
  }

  // new Date(2012, 1, 31)은 3월 2일로 넘어가 버린다. 되돌려 비교해야 "없는 날짜"를 잡는다.
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return '생년월일을 확인해주세요';
  }

  const today = new Date();
  // 만 나이: 생일이 아직 안 지났으면 한 살 뺀다.
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d);
  if (beforeBirthday) age -= 1;

  if (age < MIN_AGE) return `만 ${MIN_AGE}세 이상만 가입할 수 있습니다`;
  return null;
}
```

- [ ] **Step 5: 테스트가 통과하는지 본다**

```bash
cd mobile && npx jest lib/signup/validation.test.ts
```

기대: 전부 PASS.

- [ ] **Step 6: 커밋**

```bash
git add mobile/constants/cities.ts mobile/lib/signup/validation.ts mobile/lib/signup/validation.test.ts
git commit -m "feat(mobile): 회원가입 검증 함수와 시/도 목록 (#798)"
```

---

## Task 2: 회원가입 API 다섯 개

**Files:**
- Create: `mobile/lib/signup/api.ts`
- Test: `mobile/lib/signup/api.test.ts`

**Interfaces:**
- Consumes: `apiBaseUrl()` from `mobile/lib/auth/api.ts`
- Produces:
  - `checkEmailAvailable(email: string): Promise<boolean>`
  - `sendVerificationCode(email: string): Promise<void>`
  - `verifyCode(email: string, code: string): Promise<boolean>`
  - `checkNicknameAvailable(nickname: string): Promise<boolean>`
  - `signUp(input: SignUpInput): Promise<void>`
  - `interface SignUpInput { email; password; name; nickname; birthDate; addressSido; addressGugun }` — 전부 `string`
  - `class SignUpRejectedError extends Error` — 서버가 400/409로 거부했을 때. `message`에 서버 문구를 담는다

> **왜 `apiFetch`가 아니라 순수 `fetch`인가:** 가입 전이라 토큰이 없다. 401을 갱신 흐름으로 끌고 갈 이유도 없다. `session.ts`의 `login()`이 같은 이유로 순수 `fetch`를 쓴다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`mobile/lib/signup/api.test.ts`

```ts
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
```

- [ ] **Step 2: 테스트가 실패하는지 본다**

```bash
cd mobile && npx jest lib/signup/api.test.ts
```

기대: `Cannot find module './api'`로 실패.

- [ ] **Step 3: API를 만든다**

`mobile/lib/signup/api.ts`

```ts
import { apiBaseUrl } from '../auth/api';

// 가입 전이라 토큰이 없다. 그래서 apiFetch(401 갱신 포함)가 아니라 순수 fetch를 쓴다.
// session.ts의 login()이 같은 이유로 같은 선택을 했다.

/** 서버가 400·409로 "이래서 안 된다"고 알려준 경우. 화면이 서버 문구를 그대로 보여준다. */
export class SignUpRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignUpRejectedError';
  }
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  nickname: string;
  /** YYYY-MM-DD */
  birthDate: string;
  addressSido: string;
  addressGugun: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** 서버 응답 껍데기. 성공/실패 모두 { data, message } 모양이다. */
interface Envelope<T> {
  data?: T;
  message?: string;
}

async function readEnvelope<T>(res: Response): Promise<Envelope<T>> {
  try {
    return (await res.json()) as Envelope<T>;
  } catch {
    // 본문이 비어 있거나 JSON이 아닐 수 있다. 그때는 빈 껍데기로 본다.
    return {};
  }
}

export async function checkEmailAvailable(email: string): Promise<boolean> {
  const url = `${apiBaseUrl()}/auth/email/check?email=${encodeURIComponent(email)}`;
  const res = await fetch(url, { method: 'GET', headers: JSON_HEADERS });
  if (!res.ok) throw new Error(`이메일 확인에 실패했어요 (HTTP ${res.status})`);

  const body = await readEnvelope<boolean>(res);
  return body.data === true;
}

export async function sendVerificationCode(email: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/auth/email/verification/send`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`인증코드 발송에 실패했어요 (HTTP ${res.status})`);
}

/**
 * 코드가 틀린 것은 "오류"가 아니라 흔한 결과라서 던지지 않고 false를 돌려준다.
 * 화면이 매번 try/catch를 두르지 않아도 된다.
 */
export async function verifyCode(email: string, code: string): Promise<boolean> {
  const res = await fetch(`${apiBaseUrl()}/auth/email/verification/verify`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, verificationCode: code }),
  });

  if (res.status === 400 || res.status === 404) return false;
  if (!res.ok) throw new Error(`인증코드 확인에 실패했어요 (HTTP ${res.status})`);

  const body = await readEnvelope<boolean>(res);
  return body.data !== false;
}

export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const url = `${apiBaseUrl()}/auth/nickname/check?nickname=${encodeURIComponent(nickname)}`;
  const res = await fetch(url, { method: 'GET', headers: JSON_HEADERS });
  if (!res.ok) throw new Error(`닉네임 확인에 실패했어요 (HTTP ${res.status})`);

  const body = await readEnvelope<boolean>(res);
  return body.data === true;
}

export async function signUp(input: SignUpInput): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/auth/signup`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(input),
  });

  if (res.ok) return;

  if (res.status === 400 || res.status === 409) {
    const body = await readEnvelope<never>(res);
    throw new SignUpRejectedError(body.message ?? '입력 정보를 다시 확인해주세요.');
  }

  throw new Error(`회원가입에 실패했어요 (HTTP ${res.status})`);
}
```

- [ ] **Step 4: 테스트가 통과하는지 본다**

```bash
cd mobile && npx jest lib/signup/api.test.ts
```

기대: 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add mobile/lib/signup/api.ts mobile/lib/signup/api.test.ts
git commit -m "feat(mobile): 회원가입 API 5개 (#798)"
```

---

## Task 3: 폼 상태 훅 — 두 안이 공유한다

**Files:**
- Create: `mobile/lib/signup/use-signup-form.ts`
- Test: `mobile/lib/signup/use-signup-form.test.ts`

**Interfaces:**
- Consumes: Task 1의 `validate*`·`formatBirthDate`, Task 2의 API 5개, `login()` from `mobile/lib/auth/session.ts`
- Produces: `useSignupForm(): SignupForm`

```ts
type VerificationPhase = 'idle' | 'sent' | 'verified';

interface SignupForm {
  values: {
    email: string; code: string; password: string; passwordConfirm: string;
    name: string; nickname: string;
    birthYear: string; birthMonth: string; birthDay: string;
    addressSido: string; addressGugun: string;
  };
  setValue(key: keyof SignupForm['values'], value: string): void;
  errors: Partial<Record<keyof SignupForm['values'], string>>;

  verification: VerificationPhase;
  secondsLeft: number;          // 'sent'일 때만 의미가 있다
  sendCode(): Promise<void>;
  submitCode(): Promise<void>;
  changeEmail(): void;          // 'idle'로 되돌리고 인증 상태를 푼다

  nicknameChecked: boolean;
  checkNickname(): Promise<void>;

  canSubmit: boolean;           // A안 [가입하기]
  canGoNext: boolean;           // B안 [다음]
  submitting: boolean;
  formError: string | null;
  submit(): Promise<boolean>;   // 성공하면 true (화면이 닫는다)
}
```

> **`changeEmail()`이 인증 상태까지 푸는 이유:** 인증한 주소와 가입하는 주소가 달라지면 서버가 막는다(§6·§7). 웹이 이걸 안 해서 구멍이 생겼다.
>
> **`sendCode()`가 `verification === 'verified'`면 아무 일도 안 하는 이유:** 서버는 코드를 다시 보낼 때 기존 인증 기록을 지운다(`EmailVerificationServiceImpl:41`). 인증이 끝난 뒤 재발송하면 가입이 막힌다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`mobile/lib/signup/use-signup-form.test.ts`

```ts
jest.mock('./api');
jest.mock('../auth/session');

import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as api from './api';
import * as session from '../auth/session';
import { useSignupForm } from './use-signup-form';

const mockedApi = api as jest.Mocked<typeof api>;
const mockedSession = session as jest.Mocked<typeof session>;

/** 가입 직전까지 값을 다 채운다. 여러 테스트가 같은 준비를 쓴다. */
function fillEverything(form: ReturnType<typeof useSignupForm>) {
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
    const { result } = renderHook(() => useSignupForm());

    act(() => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });

    expect(result.current.verification).toBe('sent');
    expect(result.current.secondsLeft).toBe(299);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.secondsLeft).toBe(297);
  });

  it('이미 가입된 이메일이면 코드를 안 보내고 오류를 남긴다', async () => {
    mockedApi.checkEmailAvailable.mockResolvedValue(false);
    const { result } = renderHook(() => useSignupForm());

    act(() => result.current.setValue('email', 'taken@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });

    expect(mockedApi.sendVerificationCode).not.toHaveBeenCalled();
    expect(result.current.verification).toBe('idle');
    expect(result.current.errors.email).toBeTruthy();
  });

  it('코드가 맞으면 verified가 된다', async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });
    act(() => result.current.setValue('code', '123456'));
    await act(async () => {
      await result.current.submitCode();
    });

    expect(result.current.verification).toBe('verified');
  });

  it('인증이 끝난 뒤 sendCode를 불러도 서버를 안 부른다', async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });
    act(() => result.current.setValue('code', '123456'));
    await act(async () => {
      await result.current.submitCode();
    });

    mockedApi.sendVerificationCode.mockClear();
    await act(async () => {
      await result.current.sendCode();
    });

    expect(mockedApi.sendVerificationCode).not.toHaveBeenCalled();
  });

  it('changeEmail을 부르면 idle로 돌아가고 코드가 비워진다', async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });
    act(() => result.current.setValue('code', '123456'));
    await act(async () => {
      await result.current.submitCode();
    });

    act(() => result.current.changeEmail());

    expect(result.current.verification).toBe('idle');
    expect(result.current.values.code).toBe('');
  });

  it('5분이 지나면 idle로 돌아간다', async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });
    act(() => {
      jest.advanceTimersByTime(300_000);
    });

    expect(result.current.verification).toBe('idle');
  });
});

describe('닉네임 중복체크', () => {
  it('중복체크를 다시 하기 전에는 nicknameChecked가 꺼진다', async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => result.current.setValue('nickname', '주현'));
    await act(async () => {
      await result.current.checkNickname();
    });
    expect(result.current.nicknameChecked).toBe(true);

    act(() => result.current.setValue('nickname', '주현2'));
    expect(result.current.nicknameChecked).toBe(false);
  });
});

describe('canGoNext (B안 1단계)', () => {
  it('인증이 끝나고 비밀번호가 맞아야 켜진다', async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });
    act(() => result.current.setValue('code', '123456'));
    await act(async () => {
      await result.current.submitCode();
    });
    expect(result.current.canGoNext).toBe(false);

    act(() => {
      result.current.setValue('password', 'Abcdef1!xy');
      result.current.setValue('passwordConfirm', 'Abcdef1!xy');
    });
    expect(result.current.canGoNext).toBe(true);
  });
});

describe('submit', () => {
  it('가입에 성공하면 곧바로 로그인하고 true를 돌려준다', async () => {
    const { result } = renderHook(() => useSignupForm());

    act(() => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });
    act(() => result.current.setValue('code', '123456'));
    await act(async () => {
      await result.current.submitCode();
    });
    act(() => fillEverything(result.current));
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
    const { result } = renderHook(() => useSignupForm());

    act(() => result.current.setValue('email', 'me@cuddle.com'));
    await act(async () => {
      await result.current.sendCode();
    });
    act(() => result.current.setValue('code', '123456'));
    await act(async () => {
      await result.current.submitCode();
    });
    act(() => fillEverything(result.current));
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
});
```

- [ ] **Step 2: 테스트 도구를 설치한다**

훅 테스트에 `@testing-library/react-native`가 필요하다. 앱에는 아직 없다.

```bash
cd mobile && pnpm add -D @testing-library/react-native
```

> 이건 **개발 의존성**이라 앱 번들에 안 들어간다. Global Constraints의 "새 네이티브 모듈 금지"에 걸리지 않는다.

- [ ] **Step 3: 테스트가 실패하는지 본다**

```bash
cd mobile && npx jest lib/signup/use-signup-form.test.ts
```

기대: `Cannot find module './use-signup-form'`로 실패.

- [ ] **Step 4: 훅을 만든다**

`mobile/lib/signup/use-signup-form.ts`

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { login } from '../auth/session';
import {
  SignUpRejectedError,
  checkEmailAvailable,
  checkNicknameAvailable,
  sendVerificationCode,
  signUp,
  verifyCode,
} from './api';
import {
  formatBirthDate,
  validateBirthDate,
  validateEmail,
  validateName,
  validateNickname,
  validatePassword,
  validatePasswordConfirm,
} from './validation';

/** 서버 만료가 5분이라 그대로 맞춘다(EmailVerificationServiceImpl). */
const CODE_TTL_SECONDS = 300;

export type VerificationPhase = 'idle' | 'sent' | 'verified';

const EMPTY_VALUES = {
  email: '',
  code: '',
  password: '',
  passwordConfirm: '',
  name: '',
  nickname: '',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  addressSido: '',
  addressGugun: '',
};

export type SignupValues = typeof EMPTY_VALUES;
type Errors = Partial<Record<keyof SignupValues, string>>;

export function useSignupForm() {
  const [values, setValues] = useState<SignupValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Errors>({});
  const [verification, setVerification] = useState<VerificationPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // 화면이 사라진 뒤 setState가 불리지 않게 정리한다.
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimer = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);
  useEffect(() => stopTimer, [stopTimer]);

  const setValue = useCallback(
    (key: keyof SignupValues, value: string) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
      setFormError(null);

      // 닉네임을 고치면 확인이 무효가 된다. 안 그러면 확인한 적 없는 닉네임으로 가입한다.
      if (key === 'nickname') setNicknameChecked(false);
    },
    []
  );

  const startTimer = useCallback(() => {
    stopTimer();
    setSecondsLeft(CODE_TTL_SECONDS - 1); // 화면에 4:59부터 보이게 한다
    tickRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          stopTimer();
          // 코드가 만료되면 처음 상태로 돌린다. 만료된 코드를 계속 넣게 두면 헷갈린다.
          setVerification('idle');
          setValues((v) => ({ ...v, code: '' }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const sendCode = useCallback(async () => {
    // 인증이 끝난 뒤 재발송하면 서버가 기존 인증 기록을 지워 가입이 막힌다.
    if (verification === 'verified') return;

    const emailError = validateEmail(values.email);
    if (emailError) {
      setErrors((prev) => ({ ...prev, email: emailError }));
      return;
    }

    const email = values.email.trim();
    try {
      const available = await checkEmailAvailable(email);
      if (!available) {
        setErrors((prev) => ({
          ...prev,
          email: '이미 가입된 이메일이에요. 로그인하시거나 다른 이메일을 사용해주세요.',
        }));
        return;
      }
      await sendVerificationCode(email);
      setVerification('sent');
      startTimer();
    } catch {
      setErrors((prev) => ({ ...prev, email: '인증코드 발송에 실패했어요. 잠시 후 다시 시도해주세요.' }));
    }
  }, [values.email, verification, startTimer]);

  const submitCode = useCallback(async () => {
    if (verification !== 'sent') return;
    if (values.code.trim().length === 0) {
      setErrors((prev) => ({ ...prev, code: '전송된 코드를 입력해주세요' }));
      return;
    }

    try {
      const ok = await verifyCode(values.email.trim(), values.code.trim());
      if (!ok) {
        setErrors((prev) => ({ ...prev, code: '인증코드가 올바르지 않아요. 다시 확인해주세요.' }));
        return;
      }
      stopTimer();
      setVerification('verified');
    } catch {
      setErrors((prev) => ({ ...prev, code: '인증에 실패했어요. 잠시 후 다시 시도해주세요.' }));
    }
  }, [values.code, values.email, verification, stopTimer]);

  const changeEmail = useCallback(() => {
    stopTimer();
    setVerification('idle');
    setSecondsLeft(0);
    setValues((prev) => ({ ...prev, code: '' }));
    setErrors((prev) => ({ ...prev, email: undefined, code: undefined }));
  }, [stopTimer]);

  const checkNickname = useCallback(async () => {
    const error = validateNickname(values.nickname);
    if (error) {
      setErrors((prev) => ({ ...prev, nickname: error }));
      return;
    }

    try {
      const available = await checkNicknameAvailable(values.nickname.trim());
      if (!available) {
        setErrors((prev) => ({ ...prev, nickname: '이미 사용 중인 닉네임이에요.' }));
        setNicknameChecked(false);
        return;
      }
      setNicknameChecked(true);
    } catch {
      setErrors((prev) => ({ ...prev, nickname: '닉네임 확인에 실패했어요.' }));
    }
  }, [values.nickname]);

  const canGoNext = useMemo(
    () =>
      verification === 'verified' &&
      validatePassword(values.password) === null &&
      validatePasswordConfirm(values.password, values.passwordConfirm) === null,
    [verification, values.password, values.passwordConfirm]
  );

  const canSubmit = useMemo(
    () =>
      canGoNext &&
      nicknameChecked &&
      validateName(values.name) === null &&
      validateNickname(values.nickname) === null &&
      validateBirthDate(values.birthYear, values.birthMonth, values.birthDay) === null &&
      values.addressSido.length > 0 &&
      values.addressGugun.length > 0,
    [canGoNext, nicknameChecked, values]
  );

  const submit = useCallback(async (): Promise<boolean> => {
    if (submitting) return false;

    // 버튼이 꺼져 있어도 한 번 더 본다. 어느 칸이 문제인지 화면에 표시해야 한다.
    const nextErrors: Errors = {
      name: validateName(values.name) ?? undefined,
      nickname: validateNickname(values.nickname) ?? undefined,
      password: validatePassword(values.password) ?? undefined,
      passwordConfirm:
        validatePasswordConfirm(values.password, values.passwordConfirm) ?? undefined,
      birthYear:
        validateBirthDate(values.birthYear, values.birthMonth, values.birthDay) ?? undefined,
      addressSido: values.addressSido ? undefined : '거주지를 선택해주세요',
    };
    setErrors((prev) => ({ ...prev, ...nextErrors }));
    if (Object.values(nextErrors).some(Boolean)) return false;

    if (verification !== 'verified') {
      setFormError('이메일 인증을 완료해주세요.');
      return false;
    }
    if (!nicknameChecked) {
      setErrors((prev) => ({ ...prev, nickname: '닉네임 중복체크를 완료해주세요.' }));
      return false;
    }

    setSubmitting(true);
    setFormError(null);
    const email = values.email.trim();

    try {
      await signUp({
        email,
        password: values.password,
        name: values.name.trim(),
        nickname: values.nickname.trim(),
        birthDate: formatBirthDate(values.birthYear, values.birthMonth, values.birthDay),
        addressSido: values.addressSido,
        addressGugun: values.addressGugun,
      });

      // 웹과 같이 가입 직후 로그인해 세션을 만든다(SignUpForm.tsx:111-116).
      await login(email, values.password);
      return true;
    } catch (err) {
      if (err instanceof SignUpRejectedError) {
        setFormError(err.message);
      } else if (err instanceof TypeError) {
        setFormError('인터넷 연결을 확인해주세요.');
      } else {
        setFormError('회원가입 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [submitting, values, verification, nicknameChecked]);

  return {
    values,
    setValue,
    errors,
    verification,
    secondsLeft,
    sendCode,
    submitCode,
    changeEmail,
    nicknameChecked,
    checkNickname,
    canSubmit,
    canGoNext,
    submitting,
    formError,
    submit,
  };
}
```

- [ ] **Step 5: 테스트가 통과하는지 본다**

```bash
cd mobile && npx jest lib/signup/use-signup-form.test.ts
```

기대: 전부 PASS.

- [ ] **Step 6: 커밋**

```bash
git add mobile/lib/signup/use-signup-form.ts mobile/lib/signup/use-signup-form.test.ts mobile/package.json
git commit -m "feat(mobile): 회원가입 폼 상태 훅 — 두 안이 공유 (#798)"
```

---

## Task 4: 입력칸 조각들

**Files:**
- Create: `mobile/components/signup/field.tsx`
- Create: `mobile/components/signup/email-verification.tsx`
- Create: `mobile/components/signup/birth-date-field.tsx`
- Create: `mobile/components/signup/address-field.tsx`

**Interfaces:**
- Consumes: Task 3의 `useSignupForm()` 반환값을 통째로 `form` prop으로 받는다
- Produces: `<Field>`, `<EmailVerification form={form} />`, `<BirthDateField form={form} />`, `<AddressField form={form} />`

> 화면 조각에는 자동 테스트를 쓰지 않는다. 이 저장소는 지금 순수 함수·훅만 Jest로 덮고 화면은 실기기로 본다. 새 방식을 이번 바퀴에 들이지 않는다.

색·크기는 **`login-form.tsx`의 `styles`를 그대로 따른다** — 두 화면이 따로 놀면 안 된다.

- [ ] **Step 1: 공용 입력칸을 만든다**

`mobile/components/signup/field.tsx`

```tsx
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  /** 오류가 있으면 문구를, 없으면 null */
  error?: string;
  /** 오른쪽에 붙는 버튼 등 */
  trailing?: React.ReactNode;
  /** 라벨 아래 회색 안내문 */
  hint?: string;
}

export function Field({ label, error, trailing, hint, style, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.grow, error ? styles.inputError : null, style]}
          placeholderTextColor="#9CA3AF"
          {...inputProps}
        />
        {trailing}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export const fieldStyles = StyleSheet.create({
  button: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

const styles = StyleSheet.create({
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  grow: { flex: 1 },
  label: { fontSize: 13, color: '#6B7280' },
  input: {
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  inputError: { borderColor: '#DC2626' },
  error: { fontSize: 13, color: '#DC2626' },
  hint: { fontSize: 12, color: '#9CA3AF' },
});
```

- [ ] **Step 2: 인증 영역을 만든다 (3상태)**

`mobile/components/signup/email-verification.tsx`

```tsx
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { useSignupForm } from '@/lib/signup/use-signup-form';
import { Field, fieldStyles } from './field';

interface Props {
  form: ReturnType<typeof useSignupForm>;
}

function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function EmailVerification({ form }: Props) {
  const { values, errors, verification, secondsLeft } = form;
  const verified = verification === 'verified';

  return (
    <View style={styles.wrap}>
      <Field
        label="이메일 주소"
        value={values.email}
        onChangeText={(t) => form.setValue('email', t)}
        error={errors.email}
        placeholder="example@cuddle.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        // 인증이 끝나면 못 고치게 잠근다. 인증한 주소와 가입 주소가 달라지면 서버가 막는다.
        editable={!verified}
        hint={verified ? undefined : '사용 가능 여부를 확인한 뒤 인증코드를 보내드려요.'}
        trailing={
          verified ? null : (
            <Pressable
              onPress={form.sendCode}
              accessibilityRole="button"
              style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonDisabled]}
            >
              <Text style={fieldStyles.buttonLabel}>
                {verification === 'sent' ? '재발송' : '인증받기'}
              </Text>
            </Pressable>
          )
        }
      />

      {verified ? (
        <View style={styles.verifiedRow}>
          <Text style={styles.verifiedText}>✅ 이메일 인증이 완료되었어요.</Text>
          <Pressable onPress={form.changeEmail} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.changeLink}>이메일 변경</Text>
          </Pressable>
        </View>
      ) : null}

      {verification === 'sent' ? (
        <Field
          label="인증코드"
          value={values.code}
          onChangeText={(t) => form.setValue('code', t.replace(/[^0-9]/g, '').slice(0, 6))}
          error={errors.code}
          placeholder="전송된 코드를 입력해주세요"
          keyboardType="number-pad"
          maxLength={6}
          hint={`남은 시간 ${mmss(secondsLeft)} · 메일이 안 오면 스팸함을 확인해주세요.`}
          trailing={
            <Pressable
              onPress={form.submitCode}
              accessibilityRole="button"
              style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonDisabled]}
            >
              <Text style={fieldStyles.buttonLabel}>확인</Text>
            </Pressable>
          }
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  verifiedText: { fontSize: 13, color: '#059669' },
  changeLink: { fontSize: 13, color: '#6B7280', textDecorationLine: 'underline' },
});
```

- [ ] **Step 3: 생년월일 세 칸을 만든다**

`mobile/components/signup/birth-date-field.tsx`

```tsx
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { useSignupForm } from '@/lib/signup/use-signup-form';

interface Props {
  form: ReturnType<typeof useSignupForm>;
}

/** 숫자만 남기고 자리수를 자른다. 웹 BirthDateField와 같은 방식이다. */
function digits(text: string, max: number): string {
  return text.replace(/[^0-9]/g, '').slice(0, max);
}

export function BirthDateField({ form }: Props) {
  const { values, errors } = form;
  // 세 칸을 합쳐 하나로 보므로 오류도 birthYear 자리에 모아 둔다.
  const error = errors.birthYear;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>생년월일</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.year, error ? styles.inputError : null]}
          value={values.birthYear}
          onChangeText={(t) => form.setValue('birthYear', digits(t, 4))}
          placeholder="YYYY"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={4}
        />
        <TextInput
          style={[styles.input, styles.part, error ? styles.inputError : null]}
          value={values.birthMonth}
          onChangeText={(t) => form.setValue('birthMonth', digits(t, 2))}
          placeholder="MM"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.part, error ? styles.inputError : null]}
          value={values.birthDay}
          onChangeText={(t) => form.setValue('birthDay', digits(t, 2))}
          placeholder="DD"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={2}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  row: { flexDirection: 'row', gap: 8 },
  label: { fontSize: 13, color: '#6B7280' },
  input: {
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  inputError: { borderColor: '#DC2626' },
  year: { flex: 2 },
  part: { flex: 1 },
  error: { fontSize: 13, color: '#DC2626' },
});
```

- [ ] **Step 4: 거주지 선택을 만든다**

앱에는 셀렉트 요소가 없다. **누르면 목록이 아래에서 올라오는 방식**으로 만든다 — 이미 `components/my/withdraw-modal.tsx`가 같은 방식(`Modal` + `ScrollView`)을 쓰고 있으니 그 모양을 따른다.

`mobile/components/signup/address-field.tsx`

```tsx
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CITIES, PROVINCES } from '@/constants/cities';
import type { useSignupForm } from '@/lib/signup/use-signup-form';

interface Props {
  form: ReturnType<typeof useSignupForm>;
}

export function AddressField({ form }: Props) {
  const { values, errors } = form;
  const [open, setOpen] = useState<'sido' | 'gugun' | null>(null);

  const guguns = values.addressSido ? (CITIES[values.addressSido] ?? []) : [];
  const options = open === 'sido' ? PROVINCES : guguns;

  const pick = (value: string) => {
    if (open === 'sido') {
      form.setValue('addressSido', value);
      // 시/도가 바뀌면 이전 구/군은 더 이상 맞지 않는다. 웹 AddressField도 같이 비운다.
      form.setValue('addressGugun', '');
    } else {
      form.setValue('addressGugun', value);
    }
    setOpen(null);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.label}>거주지</Text>

      <Pressable
        onPress={() => setOpen('sido')}
        accessibilityRole="button"
        style={[styles.select, errors.addressSido ? styles.selectError : null]}
      >
        <Text style={values.addressSido ? styles.value : styles.placeholder}>
          {values.addressSido || '시/도를 선택해주세요'}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => (values.addressSido ? setOpen('gugun') : null)}
        accessibilityRole="button"
        disabled={!values.addressSido}
        style={[styles.select, !values.addressSido && styles.selectDisabled]}
      >
        <Text style={values.addressGugun ? styles.value : styles.placeholder}>
          {values.addressGugun ||
            (values.addressSido ? '시/군/구를 선택해주세요' : '먼저 시/도를 선택해주세요')}
        </Text>
      </Pressable>

      {errors.addressSido ? <Text style={styles.error}>{errors.addressSido}</Text> : null}

      <Modal visible={open !== null} animationType="slide" transparent onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(null)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{open === 'sido' ? '시/도' : '시/군/구'}</Text>
          <ScrollView>
            {options.map((option) => (
              <Pressable key={option} onPress={() => pick(option)} style={styles.option}>
                <Text style={styles.optionLabel}>{option}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 13, color: '#6B7280' },
  select: {
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectDisabled: { backgroundColor: '#F9FAFB' },
  selectError: { borderColor: '#DC2626' },
  value: { fontSize: 15, color: '#111827' },
  placeholder: { fontSize: 15, color: '#9CA3AF' },
  error: { fontSize: 13, color: '#DC2626' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    maxHeight: '60%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  option: { paddingVertical: 14 },
  optionLabel: { fontSize: 15, color: '#111827' },
});
```

- [ ] **Step 5: 타입·린트를 통과하는지 본다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

기대: 오류 0건. `CITIES`의 키 타입이 `string`과 안 맞으면 `constants/cities.ts`에서 `as const`를 빼거나 `Record<string, readonly string[]>`로 넓힌다.

- [ ] **Step 6: 커밋**

```bash
git add mobile/components/signup/
git commit -m "feat(mobile): 회원가입 입력칸 조각 4개 (#798)"
```

---

## Task 5: A안 — 한 화면

**Files:**
- Create: `mobile/app/signup.tsx`

**Interfaces:**
- Consumes: Task 3의 `useSignupForm()`, Task 4의 컴포넌트 4개
- Produces: expo-router 경로 `/signup`

- [ ] **Step 1: 화면을 만든다**

머리말·닫기 버튼·`KeyboardAvoidingView` 구성은 **`app/login.tsx`를 그대로 따른다.** 두 화면이 달라 보이면 안 된다.

`mobile/app/signup.tsx`

```tsx
import { useRouter } from 'expo-router';
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

import { AddressField } from '@/components/signup/address-field';
import { BirthDateField } from '@/components/signup/birth-date-field';
import { EmailVerification } from '@/components/signup/email-verification';
import { Field, fieldStyles } from '@/components/signup/field';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSignupForm } from '@/lib/signup/use-signup-form';

// A안 — 웹과 같이 한 화면에 전부 놓는다.
// B안(app/signup-b.tsx)과 로직은 같고 배치만 다르다. 비교가 끝나면 하나를 지운다.

export default function SignupScreen() {
  const router = useRouter();
  const form = useSignupForm();

  const handleSubmit = async () => {
    const ok = await form.submit();
    if (ok) router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="닫기">
          <IconSymbol name="chevron.left" size={26} color="#111827" />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>회원가입</Text>

          <EmailVerification form={form} />

          <Field
            label="비밀번호"
            value={form.values.password}
            onChangeText={(t) => form.setValue('password', t)}
            error={form.errors.password}
            placeholder="영문 대소문자·숫자·특수문자 포함 10자 이상"
            secureTextEntry
            autoCapitalize="none"
            textContentType="newPassword"
          />
          <Field
            label="비밀번호 확인"
            value={form.values.passwordConfirm}
            onChangeText={(t) => form.setValue('passwordConfirm', t)}
            error={form.errors.passwordConfirm}
            placeholder="비밀번호를 다시 입력해주세요"
            secureTextEntry
            autoCapitalize="none"
          />
          <Field
            label="이름"
            value={form.values.name}
            onChangeText={(t) => form.setValue('name', t)}
            error={form.errors.name}
            placeholder="이름을 입력해주세요"
            maxLength={10}
          />
          <Field
            label="닉네임"
            value={form.values.nickname}
            onChangeText={(t) => form.setValue('nickname', t)}
            error={form.errors.nickname}
            placeholder="닉네임을 입력해주세요"
            maxLength={10}
            hint={form.nicknameChecked ? '✅ 사용할 수 있는 닉네임이에요.' : undefined}
            trailing={
              <Pressable
                onPress={form.checkNickname}
                accessibilityRole="button"
                style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonDisabled]}
              >
                <Text style={fieldStyles.buttonLabel}>중복체크</Text>
              </Pressable>
            }
          />
          <BirthDateField form={form} />
          <AddressField form={form} />

          {form.formError ? <Text style={styles.formError}>{form.formError}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={!form.canSubmit || form.submitting}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.submit,
              pressed && styles.submitPressed,
              (!form.canSubmit || form.submitting) && styles.submitDisabled,
            ]}
          >
            {form.submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitLabel}>가입하기</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: { height: 48, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  formError: { fontSize: 13, color: '#DC2626' },
  submit: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    marginTop: 8,
  },
  submitPressed: { opacity: 0.8 },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
```

- [ ] **Step 2: 타입·린트를 통과하는지 본다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

`IconSymbol`의 경로·이름이 `app/login.tsx`가 쓰는 것과 같은지 확인한다. 다르면 그쪽에 맞춘다.

- [ ] **Step 3: 커밋**

```bash
git add mobile/app/signup.tsx
git commit -m "feat(mobile): 회원가입 A안 — 한 화면 (#798)"
```

---

## Task 6: B안 — 2단계

**Files:**
- Create: `mobile/app/signup-b.tsx`

**Interfaces:**
- Consumes: Task 3·4와 같다
- Produces: expo-router 경로 `/signup-b`

**핵심 규칙 (§3):**
- 화면을 둘로 안 쪼갠다. **한 화면 안에서 `step` 상태만 바꾼다** — 값이 그대로 남는다
- 2단계에서 하드웨어 뒤로가기는 **1단계로** 돌아간다
- **[다음]은 `form.canGoNext`가 켜져야 눌린다** (이메일 인증 + 비밀번호)

- [ ] **Step 1: 화면을 만든다**

`mobile/app/signup-b.tsx`

```tsx
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressField } from '@/components/signup/address-field';
import { BirthDateField } from '@/components/signup/birth-date-field';
import { EmailVerification } from '@/components/signup/email-verification';
import { Field, fieldStyles } from '@/components/signup/field';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useSignupForm } from '@/lib/signup/use-signup-form';

// B안 — 한 화면 안에서 두 단계로 나눈다.
// 라우트를 둘로 쪼개지 않는 이유: 값이 한 컴포넌트에 모여 있어야 1단계로 돌아가도
// 입력이 남는다. 쪼개면 값을 넘기는 장치가 따로 필요하다.

export default function SignupStepScreen() {
  const router = useRouter();
  const form = useSignupForm();
  const [step, setStep] = useState<1 | 2>(1);

  const goBack = useCallback(() => {
    if (step === 2) {
      setStep(1);
      return true; // 여기서 처리했으니 화면을 닫지 않는다
    }
    router.back();
    return true;
  }, [step, router]);

  // 안드로이드 하드웨어 뒤로가기. 2단계에서 누르면 1단계로 돌아간다.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', goBack);
      return () => sub.remove();
    }, [goBack])
  );

  const handleSubmit = async () => {
    const ok = await form.submit();
    if (ok) router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="뒤로">
          <IconSymbol name="chevron.left" size={26} color="#111827" />
        </Pressable>
        <Text style={styles.stepLabel}>{step} / 2</Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 1 ? (
            <>
              <Text style={styles.heading}>계정 만들기</Text>

              <EmailVerification form={form} />

              <Field
                label="비밀번호"
                value={form.values.password}
                onChangeText={(t) => form.setValue('password', t)}
                error={form.errors.password}
                placeholder="영문 대소문자·숫자·특수문자 포함 10자 이상"
                secureTextEntry
                autoCapitalize="none"
                textContentType="newPassword"
              />
              <Field
                label="비밀번호 확인"
                value={form.values.passwordConfirm}
                onChangeText={(t) => form.setValue('passwordConfirm', t)}
                error={form.errors.passwordConfirm}
                placeholder="비밀번호를 다시 입력해주세요"
                secureTextEntry
                autoCapitalize="none"
              />

              <Pressable
                onPress={() => setStep(2)}
                disabled={!form.canGoNext}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.submit,
                  pressed && styles.submitPressed,
                  !form.canGoNext && styles.submitDisabled,
                ]}
              >
                <Text style={styles.submitLabel}>다음</Text>
              </Pressable>

              {!form.canGoNext ? (
                <Text style={styles.guide}>이메일 인증과 비밀번호를 먼저 끝내주세요.</Text>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.heading}>프로필 입력</Text>

              <Field
                label="이름"
                value={form.values.name}
                onChangeText={(t) => form.setValue('name', t)}
                error={form.errors.name}
                placeholder="이름을 입력해주세요"
                maxLength={10}
              />
              <Field
                label="닉네임"
                value={form.values.nickname}
                onChangeText={(t) => form.setValue('nickname', t)}
                error={form.errors.nickname}
                placeholder="닉네임을 입력해주세요"
                maxLength={10}
                hint={form.nicknameChecked ? '✅ 사용할 수 있는 닉네임이에요.' : undefined}
                trailing={
                  <Pressable
                    onPress={form.checkNickname}
                    accessibilityRole="button"
                    style={({ pressed }) => [fieldStyles.button, pressed && fieldStyles.buttonDisabled]}
                  >
                    <Text style={fieldStyles.buttonLabel}>중복체크</Text>
                  </Pressable>
                }
              />
              <BirthDateField form={form} />
              <AddressField form={form} />

              {form.formError ? <Text style={styles.formError}>{form.formError}</Text> : null}

              <Pressable
                onPress={handleSubmit}
                disabled={!form.canSubmit || form.submitting}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.submit,
                  pressed && styles.submitPressed,
                  (!form.canSubmit || form.submitting) && styles.submitDisabled,
                ]}
              >
                {form.submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitLabel}>가입하기</Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  stepLabel: { fontSize: 13, color: '#6B7280' },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, gap: 16 },
  heading: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  guide: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  formError: { fontSize: 13, color: '#DC2626' },
  submit: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    marginTop: 8,
  },
  submitPressed: { opacity: 0.8 },
  submitDisabled: { opacity: 0.4 },
  submitLabel: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
```

- [ ] **Step 2: 타입·린트를 통과하는지 본다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

`useFocusEffect`가 `expo-router`에서 안 나오면 `@react-navigation/native`에서 가져온다. 어느 쪽이 쓰이는지 다른 화면에서 확인한다.

- [ ] **Step 3: 커밋**

```bash
git add mobile/app/signup-b.tsx
git commit -m "feat(mobile): 회원가입 B안 — 2단계 (#798)"
```

---

## Task 7: 키보드 포커스 스크롤

**Files:**
- Modify: `mobile/app/signup.tsx`, `mobile/app/signup-b.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: 없음 (동작만 바뀐다)

칸에 포커스가 가면 그 칸이 키보드 위로 올라오게 스크롤한다. **두 안 모두에 넣는다.**

- [ ] **Step 1: 두 화면의 `ScrollView`에 iOS 설정을 더한다**

```diff
         <ScrollView
           contentContainerStyle={styles.content}
           keyboardShouldPersistTaps="handled"
+          // iOS 16+에서 키보드 높이만큼 스크롤 여백을 자동으로 잡아준다.
+          automaticallyAdjustKeyboardInsets
         >
```

- [ ] **Step 2: 포커스한 칸으로 스크롤하는 처리를 더한다**

두 화면에 같은 코드를 넣는다. 안드로이드는 `automaticallyAdjustKeyboardInsets`가 없으므로 손으로 밀어 올린다.

```tsx
import { useRef } from 'react';
import type { ScrollView as RNScrollView } from 'react-native';

// ...컴포넌트 안
const scrollRef = useRef<RNScrollView>(null);

/**
 * 포커스한 칸이 키보드에 가리면 그 칸이 보이게 스크롤한다.
 * ScrollView는 포커스를 자동으로 따라가지 않는다 — 특히 안드로이드에서.
 */
const handleFocus = (event: { target: number }) => {
  // 키보드가 올라오는 애니메이션이 끝난 뒤에 재야 위치가 맞는다.
  setTimeout(() => {
    scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(event.target, 120, true);
  }, 150);
};
```

`<ScrollView ref={scrollRef} ...>`로 연결하고, `Field`에 `onFocus={handleFocus}`를 넘긴다. `Field`는 이미 `TextInputProps`를 그대로 흘려보내므로 따로 고칠 게 없다.

`BirthDateField`·`AddressField`에도 같은 `onFocus`를 넘길 수 있게 선택 prop을 더한다.

```tsx
interface Props {
  form: ReturnType<typeof useSignupForm>;
  onFocus?: (event: { target: number }) => void;
}
```

- [ ] **Step 3: 타입·린트를 통과하는지 본다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint
```

`scrollResponderScrollNativeHandleToKeyboard`의 타입이 없다고 하면 `@ts-expect-error`가 아니라 **선택 호출(`?.`)로 두고 타입 단언을 최소로** 쓴다.

- [ ] **Step 4: 커밋**

```bash
git add mobile/app/signup.tsx mobile/app/signup-b.tsx mobile/components/signup/
git commit -m "feat(mobile): 포커스한 칸이 키보드에 안 가리게 스크롤 (#798)"
```

---

## Task 8: 비교용 임시 버튼

**Files:**
- Modify: `mobile/app/login.tsx`

**Interfaces:**
- Consumes: `/signup`, `/signup-b`
- Produces: 없음. **이 작업은 Task 12에서 되돌린다**

- [ ] **Step 1: 로그인 화면 아래에 버튼 둘을 붙인다**

```tsx
{/* ⚠️ 임시 — A안·B안을 실기기에서 비교하려고 둔다. 고른 뒤 이 블록과 진 쪽 화면을 지운다(#798). */}
<View style={styles.compare}>
  <Pressable onPress={() => router.push('/signup')} accessibilityRole="button" style={styles.compareButton}>
    <Text style={styles.compareLabel}>회원가입 (A안 · 한 화면)</Text>
  </Pressable>
  <Pressable onPress={() => router.push('/signup-b')} accessibilityRole="button" style={styles.compareButton}>
    <Text style={styles.compareLabel}>회원가입 (B안 · 2단계)</Text>
  </Pressable>
</View>
```

```tsx
compare: { gap: 8, marginTop: 24 },
compareButton: {
  height: 44,
  borderRadius: 8,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: '#E5E7EB',
  alignItems: 'center',
  justifyContent: 'center',
},
compareLabel: { fontSize: 14, color: '#6B7280' },
```

- [ ] **Step 2: 게이트를 돌린다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

기대: 타입·린트 0건, 기존 66개 + 새 테스트가 전부 PASS.

- [ ] **Step 3: 커밋**

```bash
git add mobile/app/login.tsx
git commit -m "chore(mobile): A·B 비교용 임시 버튼 (#798)"
```

---

## Task 9: 백엔드 — 가입에 이메일 인증을 강제한다

**Files:**
- Modify: `~/Desktop/cmarket_api/service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/auth/app/service/AuthServiceImpl.java`

**Interfaces:**
- Consumes: `emailVerificationRepository` (이 클래스가 이미 생성자로 들고 있다)
- Produces: 없음

> ⚠️ **별도 저장소다.** `main`에 직접 커밋한다(전역 규칙의 예외). 이 맥에서는 **컴파일할 수 없다**(JDK 11, 프로젝트는 21). 푸시 후 EC2 빌드 로그로 확인한다.

- [ ] **Step 1: 지금 동작을 확인한다**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://cmarket-api.duckdns.org/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"cuddle-gate-test@example.com","password":"Abcdef1!xy","name":"시험","nickname":"게이트시험","birthDate":"2000-03-07","addressSido":"서울특별시","addressGugun":"강남구"}'
```

기대: `201` — 인증을 한 적이 없는데도 가입된다. 이게 막아야 할 구멍이다.

> 만들어진 계정은 Step 4 뒤에 탈퇴시켜 정리한다.

- [ ] **Step 2: `signUp()`에 검사를 더한다**

`AuthServiceImpl.java`의 `signUp()`, **나이 검증 다음**에 넣는다. `resetPassword`(같은 파일 208~215행)에 있는 코드를 그대로 옮긴 것이다.

```diff
         // 3. 만 14세 이상 검증
         validateAge(command.getBirthDate());
 
-        // 4. 비밀번호 암호화
+        // 4. 이메일 인증 완료 여부 확인
+        //    화면이 막고 있을 뿐 서버는 안 막고 있었다. curl로 인증 없이 가입되는 것을 확인했다.
+        //    resetPassword와 같은 방식이다 — 만료(isExpired)는 보지 않는다. 인증만 끝났으면
+        //    폼을 늦게 채워도 가입할 수 있어야 한다.
+        java.util.List<EmailVerification> verifications =
+                emailVerificationRepository.findByEmail(command.getEmail());
+        boolean isVerified = verifications.stream()
+                .anyMatch(EmailVerification::isVerified);
+
+        if (!isVerified) {
+            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다. 인증코드를 먼저 확인해주세요.");
+        }
+
+        // 5. 비밀번호 암호화
         String encodedPassword = passwordEncoder.encode(command.getPassword());
-        System.out.println(encodedPassword);
```

`System.out.println(encodedPassword);` 한 줄은 **지운다.** 해시라 평문은 아니지만 로그에 남길 이유가 없다.

아래 주석 번호(`// 5.`, `// 6.`)도 하나씩 밀어 맞춘다.

`EmailVerification` import가 이미 있는지 확인한다 — `resetPassword`가 쓰고 있으므로 있을 것이다.

- [ ] **Step 3: 커밋 · 푸시**

```bash
cd ~/Desktop/cmarket_api
git add service/cmarket-domain/src/main/java/org/cmarket/cmarket/domain/auth/app/service/AuthServiceImpl.java
git commit -m "가입할 때도 이메일 인증을 확인하도록"
git push origin main
```

- [ ] **Step 4: EC2 빌드 로그로 배포를 확인한다**

배포가 끝나면 Step 1의 `curl`을 **이메일만 바꿔** 다시 쏜다.

기대: `400` — `"이메일 인증이 완료되지 않았습니다..."`

- [ ] **Step 5: 웹 가입이 안 깨졌는지 손으로 확인한다 (사용자)**

배포된 웹에서 정상 순서(인증 → 가입)로 계정을 하나 만들어 본다. 되면 통과.

- [ ] **Step 6: 시험 계정을 정리한다 (사용자)**

Step 1에서 만들어진 계정을 탈퇴시킨다.

---

## Task 10: 웹 — 이메일이 바뀌면 인증 상태를 푼다

**Files:**
- Modify: `src/features/signup/components/EmailValidCode.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: 없음

- [ ] **Step 1: 이메일 값이 바뀌면 상태를 초기화한다**

`EmailValidCode.tsx`는 `useWatch`로 이미 `email`을 보고 있다. 그 값이 바뀌면 인증 상태를 푼다.

`import { useEffect, useRef, useState } from 'react'`로 바꾸고, `isCodeSent`/`isCodeVerified` 계산 위에 넣는다.

```tsx
// 인증을 끝낸 뒤 이메일을 고치면, 인증한 주소와 가입하는 주소가 달라진다.
// 서버는 가입 시점에 "이 이메일이 인증됐는가"를 보므로 그대로 두면 가입이 막힌다.
// (화면은 "인증 완료"라고 하는데 가입만 실패해 사용자가 영문을 모르게 된다)
const verifiedEmailRef = useRef<string | null>(null)

useEffect(() => {
  if (verifiedEmailRef.current === null) return
  if (verifiedEmailRef.current === email) return

  verifiedEmailRef.current = null
  setEmailCheckResult({ status: 'idle', message: '' })
  setCodeCheckResult({ status: 'idle', message: '' })
  setIsEmailVerified(false)
  setIsEmailCodeVerified(false)
}, [email, setIsEmailVerified, setIsEmailCodeVerified])
```

그리고 인증에 성공한 자리(`handleCheckValidCode`의 `setIsEmailCodeVerified(true)` 옆)에 **어떤 주소로 인증했는지 기록**한다.

```diff
       setIsEmailCodeVerified(true)
+      verifiedEmailRef.current = email
       clearErrors('emailCode')
```

> `useRef`를 쓰는 이유: 「인증된 적이 있는가」와 「그때 그 주소였는가」를 함께 기억해야 하는데, 이걸 state로 두면 값이 바뀔 때마다 다시 그려져 효과가 한 번 더 돈다.

- [ ] **Step 2: 타입·린트를 통과하는지 본다**

```bash
npx tsc --noEmit
npx eslint src/features/signup/components/EmailValidCode.tsx
```

기대: 오류 0건. (`pnpm lint` 전체는 아직 exit 1이 정상 — #788의 잔여 10건)

- [ ] **Step 3: 손으로 확인한다 (사용자, 로컬)**

```bash
pnpm dev
```

`/auth/signup`에서: 이메일 인증 완료 → 이메일 칸을 다른 주소로 고침 → **「✓ 인증 완료」 표시가 사라지는지** 본다.

- [ ] **Step 4: 커밋**

```bash
git add src/features/signup/components/EmailValidCode.tsx
git commit -m "fix(web): 이메일을 고치면 인증 상태를 푼다 (#798)"
```

---

## Task 11: 실기기 비교 → 하나 고르기

**Files:** 없음 (확인만)

- [ ] **Step 1: Expo Go로 띄운다**

```bash
cd mobile && pnpm expo start
```

집 밖이면 `--tunnel`을 붙인다(폰이 다른 네트워크여도 붙는다). `@expo/ngrok` 설치를 한 번 물어본다.

- [ ] **Step 2: 두 안을 다 해본다**

로그인 화면의 임시 버튼 둘로 각각 들어가 **끝까지 가입해 본다.** 볼 것:

```
□ 키보드가 아래쪽 칸(생년월일·거주지)을 가리는가
□ 포커스한 칸으로 스크롤되는가
□ 인증 후 이메일 칸이 잠기는가 / 「이메일 변경」으로 풀리는가
□ 인증 후 재발송 버튼이 사라지는가
□ 타이머가 4:59부터 내려가는가 / 0이 되면 처음으로 돌아가는가
□ B안: 2단계에서 뒤로가기를 누르면 1단계로 가고 값이 남는가
□ 가입에 성공하면 로그인된 상태로 돌아오는가
```

- [ ] **Step 3: 하나를 고른다 (사용자)**

- [ ] **Step 4: 진 쪽을 지운다**

A안을 골랐다면:

```bash
git rm mobile/app/signup-b.tsx
```

B안을 골랐다면 `mobile/app/signup.tsx`를 지우고 `signup-b.tsx`를 `signup.tsx`로 옮긴다.

```bash
git mv mobile/app/signup-b.tsx mobile/app/signup.tsx   # A안 파일을 먼저 지운 뒤
```

- [ ] **Step 5: 임시 버튼을 지우고 진짜 통로를 만든다**

`app/login.tsx`의 임시 블록을 지우고, 그 자리에 회원가입으로 가는 줄을 하나 둔다.

```tsx
<Pressable onPress={() => router.push('/signup')} accessibilityRole="button" hitSlop={8}>
  <Text style={styles.signupLink}>아직 계정이 없으신가요? 회원가입하기</Text>
</Pressable>
```

- [ ] **Step 6: 게이트를 돌린다**

```bash
cd mobile && npx tsc --noEmit && npx expo lint && npx jest
```

- [ ] **Step 7: 커밋**

```bash
git add -A mobile/
git commit -m "feat(mobile): 회원가입 화면 확정 · 비교용 임시 코드 제거 (#798)"
```

---

## Task 12: 마무리

- [ ] **Step 1: 스펙에 고른 결과를 적는다**

`docs/superpowers/specs/2026-07-31-rn-signup-design.md`의 §3에 무엇을 골랐고 **왜 골랐는지** 한 문단 더한다. 다음 바퀴가 같은 고민을 반복하지 않게 한다.

- [ ] **Step 2: Play Console 신고를 고친다 (사용자)**

「앱 콘텐츠 → 데이터 보안」의 **계정 생성 방법**을 「앱에서 계정을 만들도록 허용하지 않음」에서 **「이메일로 계정 생성」** 으로 바꾼다.

- [ ] **Step 3: 커밋 · PR**

```bash
git add docs/superpowers/specs/2026-07-31-rn-signup-design.md
git commit -m "docs: 7바퀴에서 고른 화면 구조와 이유 (#798)"
```

`/commit-push`로 PR을 만든다. **base는 `develop`이다.** 본문에 `Close #798`을 넣는다.

- [ ] **Step 4: 테스트 러너 이슈를 만든다**

웹 저장소에 테스트 러너가 없다(`test` 스크립트도 `@testing-library/*`도 없다). Task 10의 변경을 **자동으로 확인할 수단이 없어** 손으로만 확인했다. 별도 이슈로 만든다.

```
제목: chore: 웹 테스트 러너 구성 (vitest + RTL)
내용: 첫 대상 = #798의 EmailValidCode 인증 상태 해제
```

---

## 완료 기준 (스펙 §11)

```
□ 앱에서 이메일로 가입이 되고, 곧바로 로그인된 상태로 홈에 들어간다
□ A안·B안을 실기기에서 눌러 보고 하나를 골랐다. 진 쪽과 임시 버튼을 지웠다
□ 인증 완료 뒤 이메일 칸이 잠기고, 「이메일 변경」으로만 풀린다
□ 인증 완료 뒤 재발송이 눌리지 않는다
□ 인증 없이 가입을 시도하면 서버가 막는다 (curl로 확인)
□ 웹에서 인증 후 이메일을 고치면 인증 표시가 사라진다
□ 웹 기존 가입 흐름이 그대로 된다
□ 앱: tsc · lint · jest 통과
□ 웹: tsc · 바뀐 파일 eslint 통과
□ Play Console 「계정 생성 방법」 신고를 고쳤다
```
