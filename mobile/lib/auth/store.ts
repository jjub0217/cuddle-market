import { create } from 'zustand';

// 로그인 상태와 메모리 토큰. 화면들이 구독하고, 리액트 밖(apiFetch)에서는
// getState()로 읽는다.
//
// 왜 React Context가 아닌가:
// apiFetch는 리액트 컴포넌트가 아니라서 Context를 읽을 수 없다. Context로 가면
// "Context용 상태"와 "래퍼가 읽을 모듈 변수"를 둘 다 두고 손으로 맞춰야 하고,
// 어긋나면 로그인은 됐는데 요청에 토큰이 안 붙는 증상이 난다.
//
// 왜 persist를 안 쓰나:
// zustand persist는 상태를 통째로 한 키에 넣는데, SecureStore는 값 하나당 ~2KB
// 제한이 있다. 저장은 tokens.ts가 키를 나눠서 맡는다.

/**
 * restoring — 앱을 켠 직후. 기기에 토큰이 있는지 아직 읽는 중.
 * authed    — 토큰이 있다. (서버에서 아직 살아있는지는 첫 요청 때 밝혀진다)
 * guest     — 토큰이 없다.
 */
export type AuthStatus = 'restoring' | 'authed' | 'guest';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;

  setSession: (tokens: { accessToken: string; refreshToken: string }) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'restoring',
  accessToken: null,
  refreshToken: null,

  setSession: ({ accessToken, refreshToken }) =>
    set({ status: 'authed', accessToken, refreshToken }),

  setAccessToken: (accessToken) => set({ accessToken }),

  clearSession: () => set({ status: 'guest', accessToken: null, refreshToken: null }),
}));
