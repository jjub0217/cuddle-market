// apiFetch가 SecureStore를 타는데 네이티브 모듈이라 jest에서 못 돈다.
// products.test.ts가 같은 이유로 같은 mock을 쓴다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { useAuthStore } from './auth/store';
import { fetchMe, updateMe } from './profile';

const mockFetch = jest.fn();

/** 요청에 실린 두 번째 인자(method·body 등)를 꺼낸다 */
function initOf(call: unknown[]): { method?: string; body?: string } {
  return (call[1] ?? {}) as { method?: string; body?: string };
}

beforeEach(() => {
  mockFetch.mockReset();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test.local/api';
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;
  useAuthStore.setState({ status: 'authed', accessToken: 'token', refreshToken: 'refresh' });
});

// 실측한 서버 응답 모양 그대로다(GET /profile/me).
// ⚠️ 서버(UserProfileResponse)는 provider·introduction 도 준다 — 앱이 안 받고 있었을 뿐이다.
const ME = {
  id: 4,
  nickname: '테스트중2',
  profileImageUrl: null,
  addressSido: '서울특별시',
  addressGugun: '강남구',
  birthDate: '1988-04-03',
  provider: 'LOCAL',
  introduction: '안녕하세요',
};

/** 여섯 개를 다 채운 저장 값. 서버가 전체 교체라 늘 여섯 개를 보낸다 */
const 저장값 = {
  nickname: '주현',
  birthDate: '1988-04-03',
  addressSido: '서울특별시',
  addressGugun: '강남구',
  profileImageUrl: 'https://cdn/a.webp',
  introduction: '안녕하세요',
};

describe('fetchMe', () => {
  it('생년월일까지 담아서 준다 — needsSocialSignup이 이 값을 본다', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: ME }) });

    await expect(fetchMe()).resolves.toMatchObject({ birthDate: '1988-04-03' });
  });

  it('provider 와 introduction 도 꺼낸다', async () => {
    // provider 는 비밀번호 바꾸는 자리를 그릴지 가른다 — 소셜 계정에는 비밀번호가 없다.
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: ME }) });

    await expect(fetchMe()).resolves.toMatchObject({
      provider: 'LOCAL',
      introduction: '안녕하세요',
    });
  });

  it('안 오면 null 이다', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 4, nickname: '협주' } }),
    });

    const me = await fetchMe();

    expect(me.provider).toBeNull();
    expect(me.introduction).toBeNull();
  });
});

describe('updateMe', () => {
  it('PATCH로 **여섯 값을 다** 보낸다', async () => {
    // ⚠️ 서버는 전체 교체다(User.java:225-240 — 받은 값을 조건 없이 그대로 넣는다).
    //    안 보낸 값은 null 로 덮여 **지워진다.** 안 고치는 값도 지금 값을 그대로 실어야 한다.
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: ME }) });

    await updateMe(저장값);

    const init = initOf(mockFetch.mock.calls[0]);
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body ?? '{}')).toEqual(저장값);
  });

  it('사진과 소개글이 비어 있어도 키를 빠뜨리지 않는다', async () => {
    // ⚠️ 「없으니 안 보낸다」로 하면 서버가 지운다 — null 을 **명시해서** 보낸다.
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: ME }) });

    await updateMe({ ...저장값, profileImageUrl: null, introduction: null });

    const sent = JSON.parse(initOf(mockFetch.mock.calls[0]).body ?? '{}');
    expect(Object.keys(sent).sort()).toEqual(Object.keys(저장값).sort());
    expect(sent.profileImageUrl).toBeNull();
    expect(sent.introduction).toBeNull();
  });

  it('서버가 막으면 던진다 — 화면이 「저장됐다」고 하면 안 된다', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) });

    await expect(updateMe(저장값)).rejects.toThrow();
  });
});
