import { render, screen } from '@testing-library/react-native';

import { ProfileHead } from './profile-head';
import type { UserProfile } from '@/lib/user-profile';

// 판매자 프로필(**남의** 프로필)의 머리 부분.
//
// ⚠️ **내 프로필(마이 화면 계정 카드)과 문구가 다르다.** 한쪽만 고치기 쉬운 자리라 못 박는다.
//    ```
//    남의 프로필   「소개글이 없습니다」        사실을 적는다
//    내 프로필     「소개글을 작성해주세요」    거기서는 그 자리가 곧 쓰러 가는 길이다
//    ```
//    #810 에서 웹이 남의 프로필에도 「작성해주세요」를 띄웠는데, 누구더러 쓰라는 건지
//    알 수 없어 앱은 그때 아예 안 그렸다. 지금은 문구를 갈라 둘 다 푼다.

function 프로필(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 7,
    nickname: '유리',
    profileImageUrl: null,
    addressSido: '서울특별시',
    addressGugun: '은평구',
    introduction: null,
    createdAt: '2023-04-12T10:30:00',
    isBlocked: false,
    isReported: false,
    ...overrides,
  };
}

it('소개글이 있으면 보여준다', async () => {
  await render(<ProfileHead profile={프로필({ introduction: '강아지 둘 키웁니다' })} />);

  expect(screen.getByText('강아지 둘 키웁니다')).toBeTruthy();
});

it('소개글이 없으면 「소개글이 없습니다」를 그린다', async () => {
  await render(<ProfileHead profile={프로필()} />);

  expect(screen.getByText('소개글이 없습니다')).toBeTruthy();
});

it('남에게 「작성해주세요」라고 하지 않는다', async () => {
  // 누구더러 쓰라는 건지 알 수 없다. 그건 내 프로필에서만 쓰는 문구다.
  await render(<ProfileHead profile={프로필()} />);

  expect(screen.queryByText('소개글을 작성해주세요')).toBeNull();
});

it('공백만 있는 소개글도 없는 것으로 본다', async () => {
  // 웹은 저장할 때 앞뒤 공백을 안 떼고 최소 2자만 봐서 공백 두 칸도 저장된다.
  await render(<ProfileHead profile={프로필({ introduction: '   ' })} />);

  expect(screen.getByText('소개글이 없습니다')).toBeTruthy();
});

// ----- 가입일 -----
//
// 중고거래에서 가입일은 **신뢰 신호**다 — 「3년 된 사람」과 「어제 가입한 사람」은
// 거래를 결정할 때 다르게 읽힌다. 웹의 남의 프로필도 같은 자리에 그린다.
//
// ⚠️ **날짜로 그린다. 「2년 전」이 아니다.** 이름표가 「가입일」이라 상대 표기와 어긋나고,
//    「2년 전」은 1년 7개월도 2년 11개월도 된다 — 거래 상대를 가늠하는 자리에서 뭉뚱그리면
//    안 좋다. 앱이 getTimeAgo 를 쓰는 곳(게시글·댓글·알림)은 「방금 것인가」가 중요한 값이라
//    성격이 다르다.

it('가입일을 날짜로 보여준다', async () => {
  // ⚠️ 「가입일 ↔ 2023.04.12」가 아니라 **한 줄로 이어 쓴다.** 이름표·구분선을 두면
  //    설정 화면 항목처럼 보인다 — 한 줄뿐인데 그 짜임을 쓰면 떠 보인다
  await render(<ProfileHead profile={프로필()} />);

  // 웹·생년월일과 같은 모양이다(@cuddle/shared 의 formatJoinDate)
  expect(screen.getByText('2023.04.12 가입')).toBeTruthy();
});

it('가입일이 없으면 줄 자체를 안 그린다', async () => {
  // 서버가 안 줄 수도 있다. 빈 줄을 그리면 「고장났나」로 보인다
  await render(<ProfileHead profile={프로필({ createdAt: null })} />);

  expect(screen.queryByText(/가입/)).toBeNull();
});

// ----- 꾹 눌러 복사 (#992) -----
//
// RN 의 <Text> 는 **기본이 선택 불가**라 꾹 눌러도 복사가 안 된다. 웹의 HTML 글자는
// 기본이 선택 가능이라 웹만 저절로 된다 — 그래서 앱만 「고장」으로 보인다(#896 과 같은 종류).

it('닉네임은 꾹 눌러 고를 수 있다', async () => {
  // 채팅·신고에서 상대를 가리킬 때 옮겨 적는 값이다.
  await render(<ProfileHead profile={프로필()} />);

  expect(screen.getByText('유리').props.selectable).toBe(true);
});

it('소개글도 꾹 눌러 고를 수 있다', async () => {
  await render(<ProfileHead profile={프로필({ introduction: '강아지 둘 키웁니다' })} />);

  expect(screen.getByText('강아지 둘 키웁니다').props.selectable).toBe(true);
});

it('지역·가입일·차단 뱃지에는 안 단다', async () => {
  // 옮겨 적을 값이 아니다. 아무 데나 달면 훑으려다 선택이 걸린다(mobile/AGENTS.md).
  await render(<ProfileHead profile={프로필({ isBlocked: true })} />);

  expect(screen.getByText('서울특별시 은평구').props.selectable).toBeFalsy();
  expect(screen.getByText('2023.04.12 가입').props.selectable).toBeFalsy();
  expect(screen.getByText('차단 유저').props.selectable).toBeFalsy();
});

// ----- 고른 글자 풀기 (#992) -----
//
// 빈 곳을 눌렀을 때 선택을 푸는 일은 화면(users/[id].tsx)의 useSelectionClear 가 한다.
// 이 조각은 그 **열쇠만 받아** `selectable` 글자 둘에 건다.
//
// ⚠️ 예전에는 이 조각이 배경 <Pressable> 을 직접 깔았다(testID="profile-head-backdrop").
//    배경은 「그 위에 아무 뷰도 없는 자리」에서만 누름을 받아 **거의 안 먹었다** — 지웠다.
//    ⚠️ 실제로 안드로이드의 선택이 풀리는지는 **실기기로만** 볼 수 있다(mobile/AGENTS.md).
//       여기서 지킬 수 있는 것은 「열쇠가 바뀌어도 글자가 그대로 보이고 selectable 이다」까지다.

it('배경 Pressable 을 깔지 않는다', async () => {
  await render(<ProfileHead profile={프로필()} />);

  expect(screen.queryByTestId('profile-head-backdrop')).toBeNull();
});

it('열쇠가 바뀌어도 닉네임·소개글은 그대로 보이고 고를 수 있다', async () => {
  // ⚠️ rerender 도 await 해야 한다. 안 하면 오류 없이 **옛 값**을 준다(mobile/AGENTS.md).
  const { rerender } = await render(
    <ProfileHead profile={프로필({ introduction: '강아지 둘 키웁니다' })} 선택열쇠={0} />
  );

  await rerender(
    <ProfileHead profile={프로필({ introduction: '강아지 둘 키웁니다' })} 선택열쇠={1} />
  );

  expect(screen.getByText('유리').props.selectable).toBe(true);
  expect(screen.getByText('강아지 둘 키웁니다').props.selectable).toBe(true);
});
