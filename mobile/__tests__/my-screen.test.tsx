import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import MyScreen from '@/app/(tabs)/(my)/index';
import { useAuthStore } from '@/lib/auth/store';

// 마이 화면의 **계정 카드**를 지킨다.
//
// ⚠️ **`app/` 안에 두지 않는다.** expo-router 는 `app/` 의 모든 파일을 화면으로 봐서
//    시험 파일까지 앱 번들에 끼워 넣으려다 **실기기가 아예 안 뜬다**(#857).

jest.mock('@/hooks/use-me', () => ({ useMe: jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const { useMe } = jest.requireMock('@/hooks/use-me') as { useMe: jest.Mock };

function 내정보(overrides: Record<string, unknown> = {}) {
  return {
    id: 4,
    nickname: '협주',
    profileImageUrl: null,
    addressSido: '서울특별시',
    addressGugun: '은평구',
    birthDate: '1996-02-17',
    provider: 'LOCAL',
    introduction: null,
    ...overrides,
  };
}

// ⚠️ 이 화면은 `useMe` 말고도 조회를 쓴다(안 읽은 알림 개수). 하나만 막으면
//    「No QueryClient set」으로 터진다 — 감싸개가 필요하다.
function 감싸기({ children }: { children: ReactNode }) {
  // ⚠️ `gcTime: Infinity` 가 **꼭 있어야 한다.** 없으면 시험은 다 초록인데
  //    **jest 가 스스로 안 끝난다** — 기본 `gcTime` 이 5분이라 「5분 뒤에 버린다」
  //    타이머가 남는다(`mobile/AGENTS.md` 에 적힌 함정이다). 이 파일과
  //    `my-screen.test.tsx` 둘만 이걸 안 따르고 있었다(2026-08-24 에 찾아 고쳤다).
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  useAuthStore.setState({ status: 'authed', accessToken: 'token', refreshToken: 'refresh' });
  useMe.mockReturnValue({ data: 내정보(), isLoading: false });
});

it('계정 카드를 누르면 프로필 수정으로 갈 수 있다', async () => {
  // 웹도 여기가 유일한 길이다(`ProfileData.tsx` 의 `ROUTES.PROFILE_UPDATE` 링크).
  await render(<MyScreen />, { wrapper: 감싸기 });

  expect(screen.getByTestId('profile-card')).toBeTruthy();
});

it('소개글이 있으면 보여준다', async () => {
  useMe.mockReturnValue({ data: 내정보({ introduction: '강아지 둘 키웁니다' }), isLoading: false });

  await render(<MyScreen />, { wrapper: 감싸기 });

  expect(screen.getByText('강아지 둘 키웁니다')).toBeTruthy();
});

it('소개글이 없으면 **쓰러 가는 안내**를 보여준다', async () => {
  // ⚠️ 내 프로필에서는 빈 자리가 곧 「쓰러 가는 길」이다. 웹도 그렇다
  //    (`ProfileData.tsx` — `introduction || (isMyProfile ? '소개글을 작성해주세요' : '소개글이 없습니다')`).
  //    남의 프로필에서는 대신 「소개글이 없습니다」를 그린다(`profile-head.tsx` 의 `introduction` 줄) —
  //    「작성해주세요」가 누구더러 쓰라는 건지 알 수 없기 때문이다.
  await render(<MyScreen />, { wrapper: 감싸기 });

  expect(screen.getByText('소개글을 작성해주세요')).toBeTruthy();
});

it('공백만 있는 소개글도 없는 것으로 본다', async () => {
  useMe.mockReturnValue({ data: 내정보({ introduction: '   ' }), isLoading: false });

  await render(<MyScreen />, { wrapper: 감싸기 });

  expect(screen.getByText('소개글을 작성해주세요')).toBeTruthy();
});

it('게스트면 계정 카드가 아예 없다', async () => {
  // 로그아웃 직후처럼 잠깐 스쳐 갈 때다. 「로그인이 필요합니다」로 갈라진다.
  useAuthStore.setState({ status: 'guest', accessToken: null, refreshToken: null });

  await render(<MyScreen />, { wrapper: 감싸기 });

  expect(screen.queryByTestId('profile-card')).toBeNull();
  expect(screen.getByText('로그인이 필요합니다.')).toBeTruthy();
});
