// 소셜 로그인. 브라우저로 서버 흐름을 태우고, 돌아온 주소에서 토큰을 꺼낸다.
//
// 왜 브라우저인가: 카카오·구글을 한 방식으로 덮을 수 있고 네이티브 설정이 없다.
// 1.1에서 둘 다 네이티브 SDK로 바꾼다(설계 §2④).

/** 서버에 등록된 제공자. 네이버는 지도용이라 로그인에 없다 */
export type SocialProvider = 'kakao' | 'google';

export type OAuthCallback =
  | { kind: 'tokens'; accessToken: string; refreshToken: string }
  | { kind: 'error'; message: string }
  | { kind: 'unknown' };

/**
 * 서버가 돌려보낸 주소를 읽는다.
 *
 *   성공  cuddlemarket://oauth?accessToken=…&refreshToken=…
 *   실패  cuddlemarket://oauth?error=…
 *
 * ⚠️ 토큰이 하나만 오면 못 쓴다. 리프레시 토큰이 없으면 액세스 토큰이 만료됐을 때
 *    되살릴 방법이 없어, 사용자는 얼마 뒤 영문 모르고 로그아웃된다.
 *    tokens.ts의 loadTokens()도 같은 이유로 하나만 있으면 없는 것으로 친다.
 */
export function parseOAuthCallback(url: string): OAuthCallback {
  let params: URLSearchParams;
  try {
    // 커스텀 스킴도 URL이 읽는다. 못 읽는 주소면 던지므로 감싼다
    params = new URL(url).searchParams;
  } catch {
    return { kind: 'unknown' };
  }

  const error = params.get('error');
  if (error) return { kind: 'error', message: error };

  const accessToken = params.get('accessToken');
  const refreshToken = params.get('refreshToken');
  if (accessToken && refreshToken) return { kind: 'tokens', accessToken, refreshToken };

  return { kind: 'unknown' };
}
