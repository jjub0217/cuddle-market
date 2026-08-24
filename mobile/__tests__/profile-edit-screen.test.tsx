import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import ProfileEditScreen from '@/app/profile-edit';
import { createScreenWrapper } from '@/test-utils/query-wrapper';

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
jest.mock('@/lib/signup/api', () => ({
  ...jest.requireActual('@/lib/signup/api'),
  checkNicknameAvailable: jest.fn(),
}));
// 사진 고르기·올리기. 앨범을 열 수 없으니 세 함수를 막고 「골라서 올라간 뒤」만 본다
jest.mock('@/lib/product-images', () => ({
  pickImages: jest.fn(),
  shrinkImage: jest.fn(),
  uploadOne: jest.fn(),
}));
jest.mock('@/lib/toast', () => ({ showToast: jest.fn() }));
jest.mock('@/hooks/use-me', () => ({ useMe: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn(), push: jest.fn() }) }));

const { updateMe } = jest.requireMock('@/lib/profile') as { updateMe: jest.Mock };
const { changePassword } = jest.requireMock('@/lib/password') as { changePassword: jest.Mock };
const { checkNicknameAvailable } = jest.requireMock('@/lib/signup/api') as {
  checkNicknameAvailable: jest.Mock;
};
const { showToast } = jest.requireMock('@/lib/toast') as { showToast: jest.Mock };
const { pickImages, shrinkImage, uploadOne } = jest.requireMock('@/lib/product-images') as {
  pickImages: jest.Mock;
  shrinkImage: jest.Mock;
  uploadOne: jest.Mock;
};
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
    // 서버가 이미 준다(UserProfileResponse.java:28,30). 못 고치는 값이라 보여주기만 한다
    name: '강주현',
    email: 'devel.jjub@gmail.com',
  };
}

// 안전영역 값과 QueryClient 설정은 mobile/test-utils/query-wrapper.tsx 로 모았다(#1059).
// ⚠️ 옮기기 전에는 이 파일만 gcTime 이 빠져 있었다 — 옮기면서 자동으로 채워진다.
const 감싸기 = createScreenWrapper({ safeArea: true });

beforeEach(() => {
  updateMe.mockReset().mockResolvedValue(undefined);
  changePassword.mockReset().mockResolvedValue(undefined);
  checkNicknameAvailable.mockReset().mockResolvedValue(true);
  showToast.mockReset();
  pickImages.mockReset().mockResolvedValue([{ uri: 'file:///고른것.jpg' }]);
  shrinkImage.mockReset().mockResolvedValue({ uri: 'file:///줄인것.webp' });
  uploadOne.mockReset().mockResolvedValue('https://cdn/새사진.webp');
  useMe.mockReturnValue({ data: 내정보(), isLoading: false });
});

it('지금 값이 칸에 채워져 있다', async () => {
  // 「지금 값에서 고치는」 화면이다. 빈 칸으로 두면 뭘 고치는지 알 수 없다.
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  expect(screen.getByDisplayValue('협주')).toBeTruthy();
  expect(screen.getByDisplayValue('안녕하세요')).toBeTruthy();
});

it('한 개만 고쳐도 **여섯 개를 다** 보낸다', async () => {
  // ⚠️ 서버가 전체 교체다. 안 보낸 값은 지워진다(lib/profile.ts 의 UpdateMeInput).
  //    소개글만 고쳐도 사진·지역·닉네임·생년월일을 그대로 실어 보내야 한다.
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('안녕하세요'), '반갑습니다');
  await fireEvent.press(screen.getByTestId('profile-save'));

  await waitFor(() => expect(updateMe).toHaveBeenCalled());
  expect(updateMe).toHaveBeenCalledWith({
    nickname: '협주',
    birthDate: '1996-02-17',
    addressSido: '서울특별시',
    addressGugun: '은평구',
    profileImageUrl: 'https://cdn/me.webp',
    introduction: '반갑습니다',
  });
});

it('고친 값으로 보낸다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('협주'), '주현');
  // ⚠️ 닉네임을 고쳤으면 중복체크를 거쳐야 저장이 열린다(아래 「닉네임 중복체크」 묶음)
  await fireEvent.press(screen.getByText('중복체크'));
  await waitFor(() => expect(checkNicknameAvailable).toHaveBeenCalledWith('주현'));
  await fireEvent.press(screen.getByTestId('profile-save'));

  await waitFor(() =>
    expect(updateMe).toHaveBeenCalledWith(expect.objectContaining({ nickname: '주현' }))
  );
});

it('닉네임이 비면 서버를 안 부른다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('협주'), '   ');
  await fireEvent.press(screen.getByTestId('profile-save'));

  // 문구는 가입 화면과 같은 함수에서 나온다(validateNickname) — 두 화면이 다른 말을 하면 안 된다
  expect(screen.getByText('닉네임을 입력해주세요')).toBeTruthy();
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

// ----- 닉네임 중복체크 -----
//
// ⚠️ **단추는 늘 보인다**(웹 `ProfileUpdateBaseForm.tsx` 의 「중복체크」 단추 ·
//    `handleNicknameCheck` 와 같다). 고쳤을 때만
//    띄우면 「닉네임은 고칠 수 있는 값」이라는 것 자체가 안 보인다.
//
// ⚠️ **확인은 고쳤을 때만 요구한다.** 가입은 늘 새 닉네임이지만, 이 화면은 사진만
//    바꾸러 오는 사람도 있다. 안 고친 닉네임까지 확인하게 하면 안 된다.

it('닉네임을 안 고쳐도 중복체크 단추가 보인다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  expect(screen.getByText('중복체크')).toBeTruthy();
});

it('닉네임이 그대로면 확인 없이 저장된다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('안녕하세요'), '반갑습니다');
  await fireEvent.press(screen.getByTestId('profile-save'));

  await waitFor(() => expect(updateMe).toHaveBeenCalled());
  expect(checkNicknameAvailable).not.toHaveBeenCalled();
});

it('내 닉네임 그대로 눌러도 **이미 사용 중이라고 안 한다**', async () => {
  // ⚠️ 서버는 누가 묻는지 모른다(AuthController.java:580 — 토큰을 안 받는다).
  //    그대로 물어보면 내 닉네임인데도 「이미 사용 중」이라고 답한다. 앱이 가로챈다
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.press(screen.getByText('중복체크'));

  expect(screen.getByText('✓ 지금 사용 중인 닉네임이에요.')).toBeTruthy();
  expect(checkNicknameAvailable).not.toHaveBeenCalled();
});

it('고친 닉네임을 확인 안 하면 서버를 안 부른다', async () => {
  // 이게 이 묶음의 핵심이다. 지금까지는 남이 쓰는 닉네임으로 저장을 눌러야 거절당했다
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('협주'), '주현');
  await fireEvent.press(screen.getByTestId('profile-save'));

  expect(screen.getByText('닉네임 중복체크를 완료해주세요.')).toBeTruthy();
  expect(updateMe).not.toHaveBeenCalled();
});

it('이미 쓰는 닉네임이면 알려준다', async () => {
  checkNicknameAvailable.mockResolvedValue(false);

  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('협주'), '주현');
  await fireEvent.press(screen.getByText('중복체크'));

  await waitFor(() => expect(screen.getByText('이미 사용 중인 닉네임이에요.')).toBeTruthy());

  await fireEvent.press(screen.getByTestId('profile-save'));
  expect(updateMe).not.toHaveBeenCalled();
});

it('확인한 뒤 또 고치면 확인이 **풀린다**', async () => {
  // 안 풀면 「확인한 적 없는 닉네임」으로 저장된다(`social-signup.tsx` 의 `changeNickname` 과 같은 이유)
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('협주'), '주현');
  await fireEvent.press(screen.getByText('중복체크'));
  await waitFor(() => expect(checkNicknameAvailable).toHaveBeenCalled());

  await fireEvent.changeText(screen.getByDisplayValue('주현'), '주현이');
  await fireEvent.press(screen.getByTestId('profile-save'));

  expect(screen.getByText('닉네임 중복체크를 완료해주세요.')).toBeTruthy();
  expect(updateMe).not.toHaveBeenCalled();
});

it('저장이 끝나면 ✓ 문구를 지운다', async () => {
  // ⚠️ 안 지우면 실기기에서 문구가 **갈아타는 게 보인다.** 저장 뒤 내 정보를 다시
  //    받아오면 「고친 닉네임」이 「내 닉네임」이 되면서 ✓ 문구가 「지금 사용 중인…」으로
  //    바뀌고, 그 상태로 화면이 닫힌다. ✓ 는 「써도 되나」의 답이라 저장으로 끝난다
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('협주'), '주현');
  await fireEvent.press(screen.getByText('중복체크'));
  await waitFor(() => expect(screen.getByText('✓ 사용할 수 있는 닉네임이에요.')).toBeTruthy());

  await fireEvent.press(screen.getByTestId('profile-save'));

  await waitFor(() => expect(updateMe).toHaveBeenCalled());
  expect(screen.queryByText('✓ 사용할 수 있는 닉네임이에요.')).toBeNull();
  expect(screen.queryByText('✓ 지금 사용 중인 닉네임이에요.')).toBeNull();
});

it('닉네임이 한 자면 서버를 안 부른다', async () => {
  // 2~10자. 웹과 같은 규칙이다(authValidationRules.ts 의 profileValidationRules.nickname).
  // 위쪽 10자는 maxLength 가 막아 주지만 아래쪽 2자는 여기서만 막힌다
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.changeText(screen.getByDisplayValue('협주'), '주');
  await fireEvent.press(screen.getByTestId('profile-save'));

  expect(screen.getByText('닉네임은 2~10자 이하이어야 합니다.')).toBeTruthy();
  expect(updateMe).not.toHaveBeenCalled();
});

// ----- 못 고치는 값 (이름·생년월일·이메일) -----
//
// ⚠️ 앱에는 **이것을 볼 수 있는 곳이 여기밖에 없었다.** 마이 화면도 닉네임만 보여줘서,
//    내가 어떤 이메일로 가입했는지조차 확인할 길이 없었다. 웹에는 늘 있던 것이다
//    (ProfileUpdateBaseForm.tsx 의 「본인 인증 정보」·「계정 정보」).

it('이름·생년월일·이메일을 보여준다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  expect(screen.getByText('강주현')).toBeTruthy();
  // ⚠️ 서버 값은 1996-02-17 인데 화면에는 점으로 잇는다. 웹과 같은 함수를 쓴다
  //    (@cuddle/shared 의 formatBirthDate) — 예전에는 웹만 바꿔 그려 같은 값이 달라 보였다
  expect(screen.getByText('1996.02.17')).toBeTruthy();
  expect(screen.getByText('devel.jjub@gmail.com')).toBeTruthy();
});

it('셋은 **고칠 수 없다** — 입력칸이 아니다', async () => {
  // 회색 글자로만 그린다. 입력칸으로 두면 고칠 수 있는 줄 알고 눌러 본다
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  expect(screen.queryByDisplayValue('강주현')).toBeNull();
  expect(screen.queryByDisplayValue('1996.02.17')).toBeNull();
  expect(screen.queryByDisplayValue('devel.jjub@gmail.com')).toBeNull();
});

it('바꾸려면 어디로 가야 하는지 알려준다', async () => {
  // 화면만 봐서는 절대 알 수 없는 것이다. 이 한 줄이 없으면 「그럼 어떻게 바꾸나」로 막힌다
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  // ⚠️ **값을 나열하지 않는다.** 「이름·생년월일·이메일은…」이라고 부르면 화면이 바뀔 때
  //    조용히 거짓말이 된다 — 웹에서 실제로 그랬다(데스크탑에는 이메일이 안 보이는데
  //    이메일도 못 고친다고 말하고 있었다). 가리키는 값 **바로 밑**에 두면 나열이 필요 없다.
  //
  // 두 줄로 나눠 둔다. 「무엇이 안 되나」와 「그럼 어떻게 하나」는 다른 이야기라
  // 한 줄로 이으면 폰의 좁은 폭에서 한 덩어리로 뭉쳐 읽힌다
  expect(screen.getByText('위 정보는 변경할 수 없습니다.')).toBeTruthy();
  expect(screen.getByText('변경이 필요하면 고객센터 1:1 문의로 알려주세요.')).toBeTruthy();
});

it('서버가 안 준 값은 자리를 안 만든다', async () => {
  // 소셜로 갓 들어온 사람은 생년월일이 없다(needsSocialSignup 이 보는 값). 빈 회색 칸을
  // 그리면 「고장났나」로 보인다
  useMe.mockReturnValue({ data: { ...내정보(), birthDate: null }, isLoading: false });

  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  expect(screen.queryByText('생년월일')).toBeNull();
  expect(screen.getByText('이름')).toBeTruthy();
});

// ----- 소개글 글자수 -----

it('소개글 밑에 글자수를 센다', async () => {
  // ⚠️ 200자에서 **조용히 안 써진다**(maxLength). 폰에서는 「키보드가 먹통인가」로 읽힌다.
  //    웹은 늘 세어 보여줬다(`ProfileUpdateBaseForm.tsx` 의 `titleLength` — 「{titleLength}/200자」)
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  expect(screen.getByText('5/200자')).toBeTruthy();

  await fireEvent.changeText(screen.getByDisplayValue('안녕하세요'), '안녕');

  expect(screen.getByText('2/200자')).toBeTruthy();
});

// ----- 바뀐 값이 없을 때 -----
//
// ⚠️ **저장 단추를 회색으로 죽이지 않는다.** 회색 단추는 왜 안 눌리는지 말해줄 자리가
//    없다. 늘 같은 모양으로 두고, 눌렀을 때 이유를 토스트로 말한다.

it('바뀐 값이 없으면 서버를 안 부르고 알려준다', async () => {
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.press(screen.getByTestId('profile-save'));

  // 문구는 웹 그대로다(`ProfileUpdateBaseForm.tsx` 의 `isUnchanged` —
  // 「변경사항이 없습니다. / 수정할 내용을 입력해주세요.」)
  expect(showToast).toHaveBeenCalledWith('변경사항이 없습니다. 수정할 내용을 입력해주세요.');
  expect(updateMe).not.toHaveBeenCalled();
});

it('사진만 바꿔도 바뀐 값으로 본다', async () => {
  // 「기본 정보」 안의 넷(사진·닉네임·지역·소개글)을 다 본다. 사진이 빠지면
  // 사진만 바꾸러 온 사람이 「변경사항이 없습니다」를 만난다
  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.press(screen.getByTestId('profile-image-pick'));
  await waitFor(() => expect(uploadOne).toHaveBeenCalled());
  await fireEvent.press(screen.getByTestId('profile-save'));

  await waitFor(() =>
    expect(updateMe).toHaveBeenCalledWith(
      expect.objectContaining({ profileImageUrl: 'https://cdn/새사진.webp' })
    )
  );
});

it('빈 소개글을 그대로 두면 바뀐 값이 없다', async () => {
  // 서버는 null, 입력칸은 ''. 둘을 안 맞춰 보면 소개글 없는 사람이 늘
  // 「바뀌었다」로 잡혀 쓸데없이 저장이 나간다
  useMe.mockReturnValue({ data: { ...내정보(), introduction: null }, isLoading: false });

  await render(<ProfileEditScreen />, { wrapper: 감싸기 });

  await fireEvent.press(screen.getByTestId('profile-save'));

  expect(updateMe).not.toHaveBeenCalled();
});

// ----- 소셜 계정 -----
//
// ⚠️ 소셜 계정에는 비밀번호가 없다. 웹과 같은 기준으로 가른다
//    (`ProfileUpdate.tsx` 의 `isSocialLogin` — `provider !== 'LOCAL'`).

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
