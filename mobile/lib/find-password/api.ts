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
