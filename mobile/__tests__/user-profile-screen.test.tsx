import { render, screen, waitFor } from '@testing-library/react-native';

import UserProfileScreen from '@/app/(tabs)/(home)/users/[id]';
import { UserNotFoundError } from '@/lib/user-profile';
import { createScreenWrapper } from '@/test-utils/query-wrapper';

// 남의 프로필 **화면**의 시험.
//
// 여기서 지키는 것은 **탈퇴한 사람을 열었을 때 무엇을 말하는가**다(#995).
// 서버가 탈퇴한 사람을 걸러 404를 주는데, 앞서는 오류를 안 갈라서 「네트워크를 확인하고
// 다시 시도해 주세요」가 떴다 — 네트워크 탈이 아닌데 계속 누르게 만드는 안내다.
//
// ⚠️ 이 시험 파일은 **app/ 밖에** 둔다. expo-router 가 app/ 안의 모든 파일을 화면으로
//    보기 때문에, 거기 두면 실기기가 아예 안 뜬다(mobile/AGENTS.md).
// ⚠️ render 는 기다려야 한다(RNTL 14).

const mock뒤로 = jest.fn();

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '7' }),
  useRouter: () => ({ back: mock뒤로, push: jest.fn(), replace: jest.fn() }),
  useSegments: () => ['(tabs)', '(home)', 'users', '[id]'],
}));

// 서버에서 받아 오는 것만 가로챈다. UserNotFoundError 는 화면이 `instanceof` 로
// 판별하므로 진짜 것을 남겨 둔다 — 흉내로 덮으면 판별이 늘 거짓이 된다.
jest.mock('@/lib/user-profile', () => ({
  ...jest.requireActual('@/lib/user-profile'),
  fetchUserProfile: jest.fn(),
  fetchUserProducts: jest.fn(),
}));

jest.mock('@/hooks/use-me', () => ({
  useMe: () => ({ data: undefined }),
}));

const { fetchUserProfile, fetchUserProducts } = jest.requireMock('@/lib/user-profile') as {
  fetchUserProfile: jest.Mock;
  fetchUserProducts: jest.Mock;
};

// 안전영역 값과 QueryClient 설정은 mobile/test-utils/query-wrapper.tsx 로 모았다(#1059).
// ⚠️ `retryDelay: 0` 을 준다. 화면이 `retry` 를 **직접 정하므로**(404만 안 되풀이한다)
//    기본 `retry: false` 만으로는 안 먹는다 — 네트워크 탈 시험이 다시 물어보는 사이
//    1초·2초를 기다리다 시간이 넘는다. 기다림만 없애면 그대로 흘러간다.
const 감싸기 = createScreenWrapper({ safeArea: true, queryOptions: { retryDelay: 0 } });

beforeEach(() => {
  mock뒤로.mockReset();
  fetchUserProfile.mockReset();
  fetchUserProducts.mockReset();
  fetchUserProducts.mockResolvedValue({ page: 0, size: 20, content: [], hasNext: false });
});

it('탈퇴한 사용자(404)면 그렇게 알리고 「다시 시도」를 안 준다', async () => {
  fetchUserProfile.mockRejectedValue(new UserNotFoundError());

  await render(<UserProfileScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText('탈퇴한 사용자예요.')).toBeTruthy());
  expect(screen.getByText('회원 탈퇴한 사용자라 프로필을 볼 수 없어요.')).toBeTruthy();

  // 몇 번을 눌러도 404다 — 다시 시도가 아니라 빠져나갈 길을 준다.
  expect(screen.queryByText('다시 시도')).toBeNull();
  expect(screen.getByText('돌아가기')).toBeTruthy();
});

it('탈퇴한 사용자면 신고·차단(⋮)을 아예 안 그린다', async () => {
  // 프로필을 못 받았으니 신고할 대상도 없다. 눌리는데 반드시 실패하는 것보다 정직하다.
  fetchUserProfile.mockRejectedValue(new UserNotFoundError());

  await render(<UserProfileScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(screen.getByText('탈퇴한 사용자예요.')).toBeTruthy());

  expect(screen.queryByLabelText('더보기')).toBeNull();
});

it('네트워크·서버 탈은 지금처럼 「다시 시도」를 그대로 둔다', async () => {
  fetchUserProfile.mockRejectedValue(new Error('프로필을 불러오지 못했어요 (HTTP 500)'));

  await render(<UserProfileScreen />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText('프로필을 불러오지 못했어요.')).toBeTruthy());
  expect(screen.getByText('다시 시도')).toBeTruthy();
  expect(screen.queryByText('탈퇴한 사용자예요.')).toBeNull();
});
