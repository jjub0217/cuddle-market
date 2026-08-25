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
  /**
   * 필수 동의 둘(#1088). 웹 `types/auth.ts` 의 `SignUpRequestData` 와 같은 이름이다.
   *
   * ⚠️ 동의 시각·약관 판은 **보내지 않는다.** 서버가 스스로 찍는다 — 화면이 만들어
   *    보내면 바꿔치기할 수 있고, 배포 시차로 화면이 아는 판과 서버 판이 어긋난다.
   */
  termsAgreed: boolean;
  privacyAgreed: boolean;
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
