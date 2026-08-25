import { apiBaseUrl } from '../auth/api';

// 계정 찾기 — 「어떻게 가입했는지」를 메일로 보내 달라고 서버에 부탁한다(#849).
//
// 로그인 전이라 토큰이 없다. 그래서 apiFetch(401 갱신 포함)가 아니라 순수 fetch 를 쓴다 —
// 가입 api(lib/signup/api.ts)·비밀번호 찾기 api(lib/find-password/api.ts)가 같은 이유로
// 같은 선택을 했다.
//
// ⚠️ 서버 엔드포인트는 **아직 없다**(2026-08-25 기준). 붙일 곳을 미리 잡아 둔 것이고,
//    명세는 docs/superpowers/specs/2026-08-25-account-enumeration-design.md §5-5 에 있다.

/** 서버에 닿지도 못했다(비행기 모드·DNS·타임아웃). **넣은 이메일과 아무 상관이 없다.** */
export class NetworkUnreachableError extends Error {
  constructor() {
    super('지금은 연결이 되지 않아요. 잠시 후 다시 시도해주세요.');
    this.name = 'NetworkUnreachableError';
  }
}

/**
 * ⚠️ **돌려주는 값이 없고, 서버가 답한 내용도 안 읽는다.**
 *
 * 이 화면은 「이 이메일이 회원인가」를 말하면 안 된다. 말하는 순간 남의 이메일을
 * 넣어 보는 것만으로 누가 가입했는지 알아낼 수 있다(계정 열거). 그래서
 * **서버가 무엇을 답하든 조용히 끝난다** — 200 이든 404 든 500 이든 같다.
 *
 * 왜 404 를 따로 다루지 않나 — 앱은 「엔드포인트가 없어서 404」와 「그런 계정이
 * 없어서 404」를 **구분할 방법이 없다.** 구분하려 드는 순간 그 구분이 곧 열거 통로가 된다.
 *
 * 던지는 것은 **서버에 닿지도 못했을 때 하나뿐이다.** fetch 는 그때만 거절한다.
 *
 * ⚠️ 비밀번호 찾기 api 의 `classify()`(서버 문구를 문자열로 뒤져 종류를 가린다)를
 *    여기로 베껴 오지 마라. 그 패턴이 #849 가 말하는 구멍 그 자체다.
 */
export async function findAccount(email: string): Promise<void> {
  // ⚠️ try 밖에서 부른다. 환경변수가 빠졌을 때 던지는 설정 오류인데, try 안에 두면
  //    그것까지 「연결이 되지 않아요」로 덮여 원인을 못 찾는다.
  const base = apiBaseUrl();
  try {
    await fetch(`${base}/auth/account/find`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new NetworkUnreachableError();
  }
}
