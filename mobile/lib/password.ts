import { apiFetch } from '@/lib/auth/api';

// 로그인한 사람이 자기 비밀번호를 바꾼다.
//
// ⚠️ **비밀번호 찾기(`lib/find-password/api.ts`)와 다른 길이다.**
//    ```
//    찾기   PATCH /auth/password/reset    로그인 **전** · email + 새 + 확인 · 순수 fetch
//    변경   PATCH /auth/password/change   로그인 **후** · 현재 + 새 + 확인 · apiFetch(토큰)
//    ```
//    변경은 토큰으로 「누구인지」를 알므로 이메일을 안 보낸다.

/**
 * 서버가 이유를 알려준 실패.
 *
 * 「현재 비밀번호가 일치하지 않습니다」 같은 것을 화면이 그대로 보여줘야 한다 —
 * 앱이 「변경에 실패했어요」로 뭉개면 무엇이 틀렸는지 알 길이 없다.
 */
export class PasswordChangeRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordChangeRejectedError';
  }
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  /**
   * ⚠️ **서버로 보내야 한다.** 앱에서만 맞춰보고 빼면 400 이 난다 —
   *    `PasswordChangeRequest.java` 가 셋 다 필수다. 비밀번호 재설정에서 이미 겪었다
   *    (`lib/find-password/api.ts:97-99`).
   */
  confirmPassword: string;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const res = await apiFetch('/auth/password/change', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

  if (res.ok) return;

  // 서버가 이유를 적어 보내면 그대로 쓴다. 응답이 JSON 이 아닐 수도 있어 감싼다.
  let message: string | undefined;
  try {
    message = ((await res.json()) as { message?: string }).message;
  } catch {
    message = undefined;
  }

  if (message) {
    throw new PasswordChangeRejectedError(message);
  }
  throw new Error(`비밀번호 변경에 실패했어요 (HTTP ${res.status})`);
}
