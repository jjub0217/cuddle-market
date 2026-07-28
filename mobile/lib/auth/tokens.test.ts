// expo-secure-store는 네이티브 모듈이라 jest에서 돌지 않는다.
// 세 함수만 가짜로 갈아끼워, "무엇을 어떤 키로 부르는지"만 검증한다.
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

import { clearTokens, loadTokens, saveAccessToken, saveTokens } from './tokens';

const mockSet = SecureStore.setItemAsync as jest.Mock;
const mockGet = SecureStore.getItemAsync as jest.Mock;
const mockDelete = SecureStore.deleteItemAsync as jest.Mock;

beforeEach(() => {
  mockSet.mockReset().mockResolvedValue(undefined);
  mockGet.mockReset();
  mockDelete.mockReset().mockResolvedValue(undefined);
});

describe('saveTokens', () => {
  it('두 토큰을 서로 다른 키에 나눠 저장한다', async () => {
    await saveTokens({ accessToken: 'a-token', refreshToken: 'r-token' });

    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenCalledWith('cuddle.accessToken', 'a-token');
    expect(mockSet).toHaveBeenCalledWith('cuddle.refreshToken', 'r-token');
  });

  it('저장이 실패해도 예외를 밖으로 던지지 않는다', async () => {
    // 저장 실패는 사용자가 할 수 있는 게 없다. 이번 세션은 메모리 토큰으로 계속 돈다.
    mockSet.mockRejectedValue(new Error('보안 저장소 오류'));

    await expect(saveTokens({ accessToken: 'a', refreshToken: 'r' })).resolves.toBeUndefined();
  });
});

describe('saveAccessToken', () => {
  it('액세스 토큰만 덮어쓴다(리프레시 토큰은 건드리지 않는다)', async () => {
    await saveAccessToken('new-a-token');

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('cuddle.accessToken', 'new-a-token');
  });
});

describe('loadTokens', () => {
  it('둘 다 있으면 두 토큰을 돌려준다', async () => {
    mockGet.mockImplementation(async (key: string) =>
      key === 'cuddle.accessToken' ? 'a-token' : 'r-token'
    );

    await expect(loadTokens()).resolves.toEqual({
      accessToken: 'a-token',
      refreshToken: 'r-token',
    });
  });

  it('리프레시 토큰이 없으면 null이다', async () => {
    // 리프레시 토큰이 없으면 만료됐을 때 되살릴 방법이 없다 → 없는 것으로 친다.
    mockGet.mockImplementation(async (key: string) =>
      key === 'cuddle.accessToken' ? 'a-token' : null
    );

    await expect(loadTokens()).resolves.toBeNull();
  });

  it('읽기가 실패하면 null이다', async () => {
    mockGet.mockRejectedValue(new Error('보안 저장소 오류'));

    await expect(loadTokens()).resolves.toBeNull();
  });
});

describe('clearTokens', () => {
  it('두 키를 모두 지운다', async () => {
    await clearTokens();

    expect(mockDelete).toHaveBeenCalledWith('cuddle.accessToken');
    expect(mockDelete).toHaveBeenCalledWith('cuddle.refreshToken');
  });
});
