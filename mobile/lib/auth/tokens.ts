import * as SecureStore from 'expo-secure-store';

// 토큰을 기기에 저장한다. SecureStore를 아는 파일은 여기 하나뿐이라,
// 나중에 저장 수단을 바꿔도 다른 파일은 손대지 않는다.
//
// 왜 키를 두 개로 나누나:
// SecureStore는 값 하나당 약 2048바이트 제한이 있다(SDK 54 문서).
// 웹처럼 {user, accessToken, refreshToken}을 한 덩어리 JSON으로 넣으면
// JWT 두 개가 합쳐져 제한을 넘길 수 있다. 값마다 키를 나누면 각각 여유가 있다.

const ACCESS_TOKEN_KEY = 'cuddle.accessToken';
const REFRESH_TOKEN_KEY = 'cuddle.refreshToken';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

/** 로그인 직후 두 토큰을 함께 저장한다. */
export async function saveTokens(tokens: StoredTokens): Promise<void> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    ]);
  } catch (error) {
    // 저장이 실패해도 이번 세션은 메모리 토큰으로 정상 동작한다.
    // 다만 앱을 재시작하면 로그인이 풀린다 — 그 원인을 개발 중에 찾을 수 있게 남긴다.
    console.warn('[auth] 토큰 저장 실패. 앱을 다시 켜면 로그인이 유지되지 않습니다.', error);
  }
}

/** 갱신으로 새로 받은 액세스 토큰만 덮어쓴다. */
export async function saveAccessToken(accessToken: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  } catch (error) {
    console.warn('[auth] 액세스 토큰 저장 실패.', error);
  }
}

/** 앱 시작 시 기기에 남아 있는 토큰을 읽는다. 하나라도 없으면 null. */
export async function loadTokens(): Promise<StoredTokens | null> {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    ]);

    // 리프레시 토큰이 없으면 만료됐을 때 되살릴 방법이 없다 → 없는 것으로 친다.
    if (!accessToken || !refreshToken) return null;

    return { accessToken, refreshToken };
  } catch (error) {
    console.warn('[auth] 토큰 읽기 실패. 로그아웃 상태로 시작합니다.', error);
    return null;
  }
}

/** 로그아웃 · 탈퇴 · 갱신 실패 시 기기에서 완전히 지운다. */
export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.warn('[auth] 토큰 삭제 실패.', error);
  }
}
