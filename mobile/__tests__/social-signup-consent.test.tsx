import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import SocialSignupScreen from '@/app/social-signup';
import { createScreenWrapper } from '@/test-utils/query-wrapper';

// 앱 소셜 가입의 **필수 동의 자물쇠**(#1088).
//
// ⚠️ `app/` 안에 두지 않는다 — expo-router 가 시험 파일까지 화면으로 보아 실기기가
//    안 뜬다(`mobile/AGENTS.md:39`).
//
// 이 화면은 폼 훅(`use-signup-form.ts`)을 안 쓰고 상태를 직접 들고 있어, 자물쇠도
// 화면 안에 있다. 그래서 훅 시험으로는 안 덮이고 여기서 따로 잰다.
//
// ⚠️⚠️ **이 시험이 초록이라고 자물쇠가 둘 다 지켜진다는 뜻은 아니다.**
//    이 화면의 자물쇠는 둘이다 —
//      ① 단추를 끈다              `disabled={submitting || !hasAllConsents}`
//      ② handleSubmit 맨 앞에서 막는다  `if (!consents.terms || !consents.privacy)`
//    그런데 **②만 지워도 아래 넷이 전부 통과한다.** RN 에는 웹의 엔터키·
//    `form.requestSubmit()` 같은 우회로가 없어서, 화면에서 저장으로 가는 길이 이 단추
//    하나뿐이다 — 단추가 꺼져 있으면 시험이 ②까지 **도달할 수가 없다.**
//    (웹 `SignUpForm.test.tsx`·`SocialSignUpForm.test.tsx` 와 앱 일반 가입
//     `use-signup-form.test.ts` 는 ② 를 직접 잡는다. 거기만 우회로가 있다)
//
//    ②는 그래도 남겨 둔 **덧문**이다. 나중에 단추 조건을 손대거나 다른 데서
//    `handleSubmit` 을 부르게 되면 그때 값을 한다.
//    ⚠️ **그러니 이 시험이 초록인 것을 근거로 ②를 지우지 마라.** 지워도 안 빨개진다.
//
// ⚠️ **`render` · `fireEvent` 를 전부 `await` 한다**(`mobile/AGENTS.md:35`).
//    안 기다리면 **오류 없이 옛 값을 준다** — 처음에 이걸 빠뜨려서 「체크박스는 분명히
//    있는데 getByRole 이 못 찾는다」로 한참 헤맸다. 조용히 틀린 것을 통과시키는 함정이라
//    빠뜨리지 마라.
//
// ⚠️ 거주지는 아래에서 올라오는 시트(`region-field.tsx` 의 BottomSheet)다. 그 안이
//    `useSafeAreaInsets` 를 불러서 감싸개가 없으면 「No safe area value available」로
//    죽는다 — `createScreenWrapper({ safeArea: true })` 가 그 값을 못 박아 준다.

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn(), back: jest.fn(), canDismiss: () => false }),
  useFocusEffect: jest.fn(),
}));
jest.mock('@/lib/profile', () => ({
  ...jest.requireActual('@/lib/profile'),
  fetchMe: jest.fn(),
  updateMe: jest.fn(),
}));
jest.mock('@/lib/signup/api', () => ({
  ...jest.requireActual('@/lib/signup/api'),
  checkNicknameAvailable: jest.fn(),
}));
jest.mock('@/lib/toast', () => ({ showToast: jest.fn() }));

const { fetchMe, updateMe } = jest.requireMock('@/lib/profile') as {
  fetchMe: jest.Mock;
  updateMe: jest.Mock;
};
const { checkNicknameAvailable } = jest.requireMock('@/lib/signup/api') as {
  checkNicknameAvailable: jest.Mock;
};

const 감싸기 = createScreenWrapper({ safeArea: true });

beforeEach(() => {
  jest.clearAllMocks();
  fetchMe.mockResolvedValue({
    id: 1,
    nickname: '주현',
    profileImageUrl: null,
    introduction: null,
  });
  updateMe.mockResolvedValue(undefined);
  checkNicknameAvailable.mockResolvedValue(true);
});

async function 화면을띄운다() {
  await render(<SocialSignupScreen />, { wrapper: 감싸기 });
  // ⚠️ 「회원가입」으로 기다리면 안 된다 — **화면 제목과 단추 글자가 같아서** 둘이 잡힌다.
  //    동의 체크는 이 화면에 하나뿐이라 그것으로 기다린다.
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: '필수. 이용약관에 동의합니다.' })).toBeTruthy()
  );
}

/**
 * 동의를 뺀 나머지를 전부 채운다. 「동의만 모자란」 상태를 만드는 것이 목적이다.
 *
 * ⚠️ 이게 이 시험의 핵심이다. 닉네임·생년월일·거주지가 비어 있으면 그쪽이 먼저 막아서,
 *    동의 자물쇠를 통째로 빼도 「저장 API 를 안 부른다」가 그대로 통과해 버린다.
 */
async function 동의만빼고전부() {
  await fireEvent.changeText(screen.getByPlaceholderText('닉네임을 입력해주세요'), '주현');
  await fireEvent.press(screen.getByRole('button', { name: '중복체크' }));
  await waitFor(() => expect(checkNicknameAvailable).toHaveBeenCalled());

  await fireEvent.changeText(screen.getByPlaceholderText('YYYY'), '2000');
  await fireEvent.changeText(screen.getByPlaceholderText('MM'), '03');
  await fireEvent.changeText(screen.getByPlaceholderText('DD'), '07');

  await fireEvent.press(screen.getByText('시/도를 선택해주세요'));
  await fireEvent.press(await screen.findByText('서울특별시'));

  // ⚠️ 구/군 칸의 문구는 시/도를 고르기 **전후가 다르다** —
  //    「먼저 시/도를 선택해주세요」 → 「시/군/구를 선택해주세요」.
  await fireEvent.press(await screen.findByText('시/군/구를 선택해주세요'));
  await fireEvent.press(await screen.findByText('강남구'));
}

async function 동의를켠다(무엇: '약관' | '방침') {
  const 이름 =
    무엇 === '약관' ? '필수. 이용약관에 동의합니다.' : '필수. 개인정보처리방침에 동의합니다.';
  await fireEvent.press(screen.getByRole('checkbox', { name: 이름 }));
}

function 가입단추() {
  return screen.getByRole('button', { name: '회원가입' });
}

it('동의까지 하면 저장 API 가 불린다 — 다른 것이 막고 있지 않다는 증거', async () => {
  await 화면을띄운다();
  await 동의만빼고전부();
  await 동의를켠다('약관');
  await 동의를켠다('방침');

  await fireEvent.press(가입단추());

  await waitFor(() => expect(updateMe).toHaveBeenCalled());
  expect(updateMe).toHaveBeenCalledWith(
    expect.objectContaining({ termsAgreed: true, privacyAgreed: true })
  );
});

it('동의를 안 하면 저장 API 를 아예 안 부른다', async () => {
  await 화면을띄운다();
  await 동의만빼고전부();

  // ⚠️ 위 시험이 「동의만 채우면 불린다」를 못 박아 두었으므로,
  //    여기서 안 불리는 것은 **동의 때문**이라고 말할 수 있다.
  await fireEvent.press(가입단추());
  await new Promise((r) => setTimeout(r, 50));

  expect(updateMe).not.toHaveBeenCalled();
});

it('하나만 동의해도 안 부른다', async () => {
  await 화면을띄운다();
  await 동의만빼고전부();
  await 동의를켠다('약관');

  await fireEvent.press(가입단추());
  await new Promise((r) => setTimeout(r, 50));

  expect(updateMe).not.toHaveBeenCalled();
});

it('둘 다 켜야 단추가 켜진다 — 하나만으로는 안 켜진다', async () => {
  await 화면을띄운다();

  expect(가입단추().props.accessibilityState?.disabled).toBe(true);

  await 동의를켠다('약관');
  expect(가입단추().props.accessibilityState?.disabled).toBe(true);

  await 동의를켠다('방침');
  expect(가입단추().props.accessibilityState?.disabled).toBe(false);

  // 껐다 켜는 것도 따라온다
  await 동의를켠다('약관');
  expect(가입단추().props.accessibilityState?.disabled).toBe(true);
});
