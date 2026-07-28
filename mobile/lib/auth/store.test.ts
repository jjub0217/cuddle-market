import { useAuthStore } from './store';

beforeEach(() => {
  // 테스트끼리 상태가 새지 않도록 초기값으로 되돌린다.
  useAuthStore.setState({ status: 'restoring', accessToken: null, refreshToken: null });
});

describe('useAuthStore', () => {
  it('처음에는 복원 중 상태다', () => {
    // 앱을 켠 직후에는 로그인인지 아닌지 아직 모른다.
    // 'guest'로 시작하면 복원되기 전에 로그인 화면으로 밀려날 수 있다.
    expect(useAuthStore.getState().status).toBe('restoring');
  });

  it('setSession은 두 토큰을 담고 authed가 된다', () => {
    useAuthStore.getState().setSession({ accessToken: 'a', refreshToken: 'r' });

    const state = useAuthStore.getState();
    expect(state.status).toBe('authed');
    expect(state.accessToken).toBe('a');
    expect(state.refreshToken).toBe('r');
  });

  it('setAccessToken은 액세스 토큰만 바꾼다', () => {
    useAuthStore.getState().setSession({ accessToken: 'a', refreshToken: 'r' });
    useAuthStore.getState().setAccessToken('a2');

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('a2');
    expect(state.refreshToken).toBe('r');
    expect(state.status).toBe('authed');
  });

  it('clearSession은 토큰을 비우고 guest가 된다', () => {
    useAuthStore.getState().setSession({ accessToken: 'a', refreshToken: 'r' });
    useAuthStore.getState().clearSession();

    const state = useAuthStore.getState();
    expect(state.status).toBe('guest');
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });
});
