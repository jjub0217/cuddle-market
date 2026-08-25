import { apiBaseUrl } from '../auth/api';

// 비밀번호 재설정 세 걸음. 로그인 전이라 토큰이 없어서 apiFetch(401 갱신 포함)가 아니라
// 순수 fetch를 쓴다 — 가입 api(lib/signup/api.ts)가 같은 이유로 같은 선택을 했다.
//
// ⚠️ 가입과 주소가 다르다. 가입은 /auth/email/verification/*, 재설정은 /auth/password/reset/*.
//    보내는 값은 같은데 서버가 하는 일이 정반대라서다 —
//      가입    「이 이메일 처음이신가요?」  처음이어야 통과
//      재설정  「이 이메일로 가입한 적 있나요?」 있어야 통과 (게다가 LOCAL 계정이어야 한다)

/** 막다른 길의 종류. 화면이 어떤 길을 내줄지 이걸로 정한다. */
export type RejectReason = 'kakao' | 'google' | 'social' | 'unknown';

/** 서버가 400으로 「이래서 안 된다」고 알려준 경우. */
export class PasswordResetRejectedError extends Error {
  /**
   * kakao·google  어느 소셜인지 알아냈다 — 화면이 「카카오로 로그인」까지 콕 집어 준다
   * social        소셜인 건 아는데 어느 쪽인지 모른다 (서버가 옛 문구를 쓰는 동안)
   * unknown       그 밖 (없는 이메일 등)
   */
  readonly reason: RejectReason;

  constructor(message: string, reason: RejectReason) {
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
 * 막다른 길의 종류를 가리는 곳은 **여기 한 군데뿐이다.**
 *
 * 서버가 IllegalArgumentException 을 전부 code: 'BAD_REQUEST' 로 내려서
 * (GlobalExceptionHandler:99) 문구 말고는 구분할 단서가 없다. 서버가 사유를 코드로
 * 나눠 주면 그때 이 함수만 고치면 된다.
 *
 * ⚠️ 옛 문구(「소셜 로그인 사용자는…」)도 함께 알아본다. 백엔드와 앱은 따로 배포되므로
 *    그 사이에는 서버가 옛 문구를 준다. 안 받아주면 그동안 「가입 이력이 없는 이메일」로
 *    잘못 안내하게 된다 — 없는 것보다 나쁜 안내다.
 */
function classify(message: string): RejectReason {
  if (message.includes('카카오')) return 'kakao';
  if (message.includes('구글')) return 'google';
  if (message.includes('소셜')) return 'social';
  return 'unknown';
}

export async function sendResetCode(email: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/auth/password/reset/send`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email }),
  });
  if (res.ok) return;

  // ⚠️ **서버 문구로 갈래를 만들지 않는다**(#849 2단계). 예전에는 400 문구를 뒤져서
  //    「카카오로 가입한 계정」·「가입된 계정 없음」을 가렸는데, 그 갈래가 곧 계정 열거였다.
  //    이제 서버는 없는 이메일·소셜·LOCAL 셋 모두에 200 을 준다.
  //    여기까지 오면 진짜 탈(500 등)이므로 뭉뚱그린 오류만 던진다.
  //
  // ⚠️ resetPassword() 쪽의 같은 갈래는 **그대로 뒀다.** 거기는 인증코드를 통과한
  //    사람만 오는 자리라 갈라 말해도 안 샌다.
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
