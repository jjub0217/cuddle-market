import { fireEvent, render, screen } from '@testing-library/react-native';

import FindAccountScreen from '@/app/find-account';

// **이 화면은 「이 이메일이 회원인가」를 말하면 안 된다**(#849).
//
// 새로 짓는 화면이라 열거 구멍을 **새로 뚫는 것**이 제일 나쁜 결과다. 그래서
// 서버가 낼 수 있는 답을 죄다 넣어 보고 **화면 글자가 하나도 안 달라지는지**를 본다.
//
// ⚠️ **`app/` 안에 두지 않는다.** expo-router 는 `app/` 의 모든 파일을 화면으로 봐서
//    시험 파일까지 앱 번들에 끼워 넣으려다 **실기기가 아예 안 뜬다**(#857).
//
// ⚠️ **시험 하나에서 화면을 한 번만 그린다.** 한 시험 안에서 그리고 지우기를 되풀이하면
//    React 19 에서 「act() 가 겹쳤다」는 경고와 함께 두 번째부터 아무것도 안 그려진다
//    (2026-08-25 에 실제로 겪었다). 그래서 답마다 시험을 따로 두고, 「모두 같은 글자」는
//    아래 상수 하나로 못 박는다 — 오히려 이 편이 더 단단하다.

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));

/**
 * 어떤 답이 와도 화면에 떠야 하는 **바로 그 글자**.
 *
 * 웹의 것과 **글자까지 같다**(src/features/find-account/components/FindAccountForm.tsx
 * 의 SENT_MESSAGE). 앱 문구를 따로 지어내지 말라는 것은 이 저장소의 규칙이다.
 */
const 같은_문구 =
  '가입된 계정이 있다면 안내 메일을 보냈습니다.\n메일함(스팸함도)을 확인해주세요.\n같은 안내는 잠시 동안 다시 보내지 않아요.';

/** 서버가 이 상태·문구로 답했다고 치자. */
function 서버가_답한다(status: number, message: string) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => ({ message }),
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://example.test/api';
});

/** 이메일을 넣고 눌러 본 뒤, 결과 박스에 뜬 글자를 돌려준다. 화면은 **한 번만** 그린다. */
async function 눌러본다(email = 'someone@example.com'): Promise<string> {
  await render(<FindAccountScreen />);

  await fireEvent.changeText(screen.getByPlaceholderText('example@gmail.com'), email);
  await fireEvent.press(screen.getByText('메일 받기'));

  return screen.getByText(/보냈습니다|연결이 되지 않아요/).props.children as string;
}

// 서버가 낼 수 있는 답을 죄다 넣어 본다.
// 위 둘은 「회원이다」, 아래 셋은 「회원이 아니다」를 뜻할 수 있는 답이다.
// **다섯이 모두 같은 글자**를 내야 한다.
describe('서버가 무엇을 답하든 화면 글자가 똑같다', () => {
  const 답들: [number, string][] = [
    [200, '안내 메일을 보냈습니다.'],
    [200, '카카오로 가입한 계정입니다.'],
    [400, '등록되지 않은 이메일입니다.'],
    [404, '사용자를 찾을 수 없습니다.'],
    [500, '서버 오류'],
  ];

  it.each(답들)('%i · %s 를 받아도 같은 글자다', async (status, message) => {
    서버가_답한다(status, message);

    expect(await 눌러본다()).toBe(같은_문구);
  });
});

it('서버 문구가 화면에 새지 않는다', async () => {
  서버가_답한다(400, '카카오로 가입한 계정입니다.');

  await 눌러본다();

  expect(screen.queryByText(/카카오/)).toBeNull();
  expect(screen.queryByText(/등록되지 않은/)).toBeNull();
});

it('넣은 이메일이 달라도 같은 글자다', async () => {
  // 회원일 법한 주소를 넣어도 위 다섯과 **같은 상수**가 나와야 한다.
  서버가_답한다(200, '안내 메일을 보냈습니다.');

  expect(await 눌러본다('member@example.com')).toBe(같은_문구);
});

it('서버에 닿지도 못하면 그때만 다른 말을 한다', async () => {
  // 이 갈래는 **넣은 이메일과 아무 상관이 없다.** 비행기 모드면 어떤 이메일을
  // 넣어도 이 문구가 나오므로 열거에 쓸 수 없다.
  global.fetch = jest
    .fn()
    .mockRejectedValue(new TypeError('Network request failed')) as unknown as typeof fetch;

  const 글자 = await 눌러본다();

  expect(글자).toContain('연결이 되지 않아요');
  expect(글자).not.toContain('가입된 계정이 있다면');
});
