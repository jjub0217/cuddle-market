import { useAuthStore } from './store';
import { clearTokens, saveAccessToken } from './tokens';

// 인증이 필요한 요청은 전부 여기를 지난다.
// 하는 일 두 가지: (1) 액세스 토큰을 Bearer로 붙인다 (2) 401이면 갱신하고 한 번 재시도한다.
//
// 웹(src/lib/api/api.ts)은 axios 인터셉터로 같은 일을 하지만, 앱은 이미 fetch로
// 통일돼 있어(mobile/lib/products.ts) 래퍼 함수 하나면 충분하다.

/** EXPO_PUBLIC_* 는 빌드 시 인라인된다. 누락되면 조용히 `fetch("undefined/...")`로 실패하지 않게 먼저 던진다. */
export function apiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error('EXPO_PUBLIC_API_BASE_URL이 설정되지 않았습니다. mobile/.env를 확인하세요.');
  }
  return url;
}

// 갱신이 도는 동안의 약속을 하나만 들고 있는다.
// 화면 여러 개가 동시에 401을 맞아도 서버에는 갱신 요청이 한 번만 간다.
let refreshPromise: Promise<string | null> | null = null;

async function requestNewAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  const res = await fetch(`${apiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return null;

  const body = (await res.json()) as { data?: { accessToken?: string } };
  const accessToken = body?.data?.accessToken;
  if (!accessToken) return null;

  useAuthStore.getState().setAccessToken(accessToken);
  await saveAccessToken(accessToken);
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken()
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/**
 * 인증이 필요한 요청을 보낸다.
 * @param path `/profile/me`처럼 슬래시로 시작하는 상대 경로
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((init.headers as Record<string, string> | undefined) ?? {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${apiBaseUrl()}${path}`, { ...init, headers });
  };

  const res = await send(useAuthStore.getState().accessToken);
  if (res.status !== 401) return res;

  const newToken = await refreshAccessToken();

  if (!newToken) {
    // 갱신 실패 = 세션이 끝났다. 기기와 메모리를 비우되 화면을 강제로 옮기지는 않는다.
    // (웹은 로그인 페이지로 밀어내지만, 앱에서 그러면 상품 보다가 통째로 튕긴다)
    await clearTokens();
    useAuthStore.getState().clearSession();
    return res;
  }

  // 재시도는 여기 한 줄뿐이다. 이게 또 401이어도 그대로 반환되므로 반복될 수 없다.
  return send(newToken);
}
