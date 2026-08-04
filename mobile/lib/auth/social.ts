import * as WebBrowser from 'expo-web-browser';

import { apiBaseUrl } from './api';
import { useAuthStore } from './store';
import { saveTokens } from './tokens';

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

/** 브라우저가 이 주소로 오면 창이 저절로 닫히고 앱으로 돌아온다 */
const REDIRECT_URL = 'cuddlemarket://oauth';

/**
 * 소셜 로그인만 쓰는 서버 뿌리 주소를 만든다.
 *
 * ⚠️ 왜 `/api`를 떼나: `apiBaseUrl()`이 주는 값은 `…duckdns.org/api`로 끝난다(mobile/.env).
 *    그런데 `/oauth2/authorization/{provider}`는 우리가 만든 REST 경로가 아니라
 *    스프링 시큐리티가 **서버 뿌리에** 직접 여는 자리다. `/api`를 붙인 채 부르면 404가 난다.
 *    웹도 `https://cmarket-api.duckdns.org/oauth2/authorization/{provider}`로 부른다
 *    (`src/features/login/components/SocialLoginButtons.tsx`).
 *
 * 끝에 붙은 `/api`만 떼고, 없으면 그대로 둔다.
 */
function oauthBaseUrl(): string {
  return apiBaseUrl().replace(/\/api\/?$/, '');
}

export type SocialLoginResult =
  | { kind: 'signedIn' }
  | { kind: 'canceled' }
  | { kind: 'failed'; message: string };

/**
 * 소셜 로그인을 시작한다. 브라우저를 열고, 돌아온 주소의 토큰으로 세션까지 세운다.
 *
 * ⚠️ `client=app` 깃발을 꼭 붙인다. 없으면 서버가 **웹 주소로** 돌려보내서
 *    브라우저 창 안에 웹 화면이 뜬 채 앱으로 못 돌아온다.
 * ⚠️ 돌아갈 주소를 파라미터로 보내지 않는다. 그대로 받아 쓰면 남이 만든 주소로
 *    토큰이 날아간다(오픈 리다이렉트). 실제 주소는 서버 설정에 못 박혀 있다.
 * ⚠️ 커스텀 스킴은 Expo Go에서 안 돈다. 개발 빌드로만 끝까지 확인된다.
 */
export async function startSocialLogin(provider: SocialProvider): Promise<SocialLoginResult> {
  const authUrl = `${oauthBaseUrl()}/oauth2/authorization/${provider}?client=app`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URL);

  // 성공이 아니면 'cancel'(사용자가 닫음) · 'dismiss'(창이 사라짐) 둘 중 하나다.
  // 사용자가 스스로 그만둔 것이니 아무 말도 하지 않는다.
  if (result.type !== 'success') return { kind: 'canceled' };

  const parsed = parseOAuthCallback(result.url);

  if (parsed.kind === 'error') return { kind: 'failed', message: parsed.message };
  if (parsed.kind === 'unknown') {
    return { kind: 'failed', message: '로그인에 실패했습니다. 다시 시도해주세요.' };
  }

  await completeSocialLogin(parsed.accessToken, parsed.refreshToken);

  return { kind: 'signedIn' };
}

/**
 * 받은 토큰으로 세션을 세운다.
 *
 * 두 길이 이리로 모인다:
 *   ① 브라우저가 돌아온 주소를 **가로챈** 경우 (위 startSocialLogin)
 *   ② 안드로이드가 딥링크를 **앱에 던진** 경우 (app/oauth.tsx)
 *
 * ⚠️ ②가 실제로 일어난다. 실기기(갤럭시·개발 빌드)에서 카카오 로그인을 마치니
 *    커스텀 탭이 가로채지 않고 cuddlemarket://oauth?... 가 앱으로 바로 왔고,
 *    받을 화면이 없어 expo-router가 「Unmatched Route」를 띄웠다(2026-08-04).
 *    그래서 두 길을 다 열어 두고, 세션 세우는 자리는 여기 하나로 모은다.
 *
 * 기기 저장 → 메모리 store 순. 저장이 실패해도 saveTokens가 삼키므로 이번 세션은
 * 정상으로 돈다(tokens.ts 주석 참고).
 */
export async function completeSocialLogin(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  await saveTokens({ accessToken, refreshToken });
  useAuthStore.getState().setSession({ accessToken, refreshToken });
}
