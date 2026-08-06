import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import ProfileEditScreen from '@/app/profile-edit';

// 프로필 수정 **화면**의 시험.
//
// ⚠️ **`app/` 안에 두지 않는다.** expo-router 는 `app/` 의 모든 파일을 화면으로 봐서
//    시험 파일까지 앱 번들에 끼워 넣으려다 **실기기가 아예 안 뜬다**(#857에서 겪었다.
//    `mobile/AGENTS.md` 함정 표). 타입체크도 린트도 안 잡아준다.

jest.mock('@/lib/profile', () => ({
  ...jest.requireActual('@/lib/profile'),
  updateMe: jest.fn(),
}));
jest.mock('@/lib/password', () => ({
  ...jest.requireActual('@/lib/password'),
  changePassword: jest.fn(),
}));
jest.mock('@/hooks/use-me', () => ({ useMe: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));

const { updateMe } = jest.requireMock('@/lib/profile') as { updateMe: jest.Mock };
const { changePassword } = jest.requireMock('@/lib/password') as { changePassword: jest.Mock };
const { useMe } = jest.requireMock('@/hooks/use-me') as { useMe: jest.Mock };

/** 서버가 주는 내 정보. provider 만 바꿔 가며 쓴다 */
function 내정보(provider: string | null = 'LOCAL') {
  return {
    id: 4,
    nickname: '협주',
    profileImageUrl: 'https://cdn/me.webp',
    addressSido: '서울특별시',
    addressGugun: '은평구',
    birthDate: '1996-02-17',
    provider,
    introduction: '안녕하세요',
  };
}

// ⚠️ 지역 고르기(RegionField)가 목록을 시트로 여는데, 그 시트가 useSafeAreaInsets 를 부른다.
//    시험에는 재는 사람이 없어 「No safe area value available」로 터지므로 값을 못 박아
//    감싸 준다(아이폰 14 기준). #855 에서도 같은 함정을 밟았다.
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function 감싸기({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

beforeEach(() => {
  updateMe.mockReset().mockResolvedValue(undefined);
  changePassword.mockReset().mockResolvedValue(undefined);
  useMe.mockReturnValue({ data: 내정보(), isLoading: false });
});

it('지금 값이 칸에 채워져 있다', async () => {
  // 「지금 값에서 고치는」 화면이다. 빈 칸으로 두면 뭘 고치는지 알 수 없다.
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  expect(screen.getByDisplayValue('협주')).toBeTruthy();
  expect(screen.getByDisplayValue('안녕하세요')).toBeTruthy();
});

it('저장하면 **여섯 개를 다** 보낸다', async () => {
  // ⚠️ 서버가 전체 교체다. 안 보낸 값은 지워진다(lib/profile.ts 의 UpdateMeInput).
  //    이 화면에서 안 고치는 생년월일도 실어 보내야 한다.
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.press(screen.getByTestId('profile-save'));

  await waitFor(() => expect(updateMe).toHaveBeenCalled());
  expect(updateMe).toHaveBeenCalledWith({
    nickname: '협주',
    birthDate: '1996-02-17',
    addressSido: '서울특별시',
    addressGugun: '은평구',
    profileImageUrl: 'https://cdn/me.webp',
    introduction: '안녕하세요',
  });
});

it('고친 값으로 보낸다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('협주'), '주현');
  await fireEvent.press(screen.getByTestId('profile-save'));

  await waitFor(() =>
    expect(updateMe).toHaveBeenCalledWith(expect.objectContaining({ nickname: '주현' }))
  );
});

it('닉네임이 비면 서버를 안 부른다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('협주'), '   ');
  await fireEvent.press(screen.getByTestId('profile-save'));

  expect(screen.getByText('닉네임을 입력해주세요.')).toBeTruthy();
  expect(updateMe).not.toHaveBeenCalled();
});

it('소개글을 비우면 null 로 보낸다', async () => {
  // 빈 글자를 보내면 「빈 소개글」이 저장된다. 없는 것과 구분되게 null 로 보낸다
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('안녕하세요'), '');
  await fireEvent.press(screen.getByTestId('profile-save'));

  await waitFor(() =>
    expect(updateMe).toHaveBeenCalledWith(expect.objectContaining({ introduction: null }))
  );
});

// ----- 소셜 계정 -----
//
// ⚠️ 소셜 계정에는 비밀번호가 없다. 웹과 같은 기준으로 가른다(ProfileUpdate.tsx:41).

it('소셜 계정이면 비밀번호 묶음이 **안 보인다**', async () => {
  useMe.mockReturnValue({ data: 내정보('KAKAO'), isLoading: false });

  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  expect(screen.queryByText('비밀번호 변경')).toBeNull();
  expect(screen.queryByTestId('password-save')).toBeNull();
});

it('이메일 계정이면 비밀번호 묶음이 보인다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  expect(screen.getByTestId('password-save')).toBeTruthy();
});

it('provider 가 아직 없으면 보여준다', async () => {
  // 서버가 안 줬다고 비밀번호 바꾸는 길을 막으면, 이메일 가입자가 영영 못 바꾼다.
  useMe.mockReturnValue({ data: 내정보(null), isLoading: false });

  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  expect(screen.getByTestId('password-save')).toBeTruthy();
});

// ----- 비밀번호 변경 -----

it('셋을 채우면 서버로 보낸다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByPlaceholderText('현재 비밀번호를 입력하세요'), 'old1234!');
  await fireEvent.changeText(screen.getByPlaceholderText('새 비밀번호를 입력하세요'), 'new1234!');
  await fireEvent.changeText(
    screen.getByPlaceholderText('새 비밀번호를 다시 입력하세요'),
    'new1234!'
  );
  await fireEvent.press(screen.getByTestId('password-save'));

  await waitFor(() =>
    expect(changePassword).toHaveBeenCalledWith({
      currentPassword: 'old1234!',
      newPassword: 'new1234!',
      // ⚠️ 확인용도 보낸다. 빼면 400 이 난다
      confirmPassword: 'new1234!',
    })
  );
});

it('새 비밀번호와 확인이 다르면 서버를 안 부른다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByPlaceholderText('현재 비밀번호를 입력하세요'), 'old1234!');
  await fireEvent.changeText(screen.getByPlaceholderText('새 비밀번호를 입력하세요'), 'new1234!');
  await fireEvent.changeText(
    screen.getByPlaceholderText('새 비밀번호를 다시 입력하세요'),
    'other1234!'
  );
  await fireEvent.press(screen.getByTestId('password-save'));

  expect(screen.getByText('새 비밀번호가 서로 달라요.')).toBeTruthy();
  expect(changePassword).not.toHaveBeenCalled();
});

it('빈 칸이 있으면 서버를 안 부른다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.press(screen.getByTestId('password-save'));

  expect(screen.getByText('모든 칸을 입력해주세요.')).toBeTruthy();
  expect(changePassword).not.toHaveBeenCalled();
});

it('서버가 막으면 **그 문구를** 보여준다', async () => {
  // 「현재 비밀번호가 일치하지 않습니다」를 그대로 보여줘야 무엇이 틀렸는지 안다
  const { PasswordChangeRejectedError } = jest.requireActual('@/lib/password');
  changePassword.mockRejectedValue(
    new PasswordChangeRejectedError('현재 비밀번호가 일치하지 않습니다.')
  );

  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByPlaceholderText('현재 비밀번호를 입력하세요'), 'wrong');
  await fireEvent.changeText(screen.getByPlaceholderText('새 비밀번호를 입력하세요'), 'new1234!');
  await fireEvent.changeText(
    screen.getByPlaceholderText('새 비밀번호를 다시 입력하세요'),
    'new1234!'
  );
  await fireEvent.press(screen.getByTestId('password-save'));

  await waitFor(() =>
    expect(screen.getByText('현재 비밀번호가 일치하지 않습니다.')).toBeTruthy()
  );
});
