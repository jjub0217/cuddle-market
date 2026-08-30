import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import FavoritesScreen from '@/app/(tabs)/my/my-favorites';
import { useAuthStore } from '@/lib/auth/store';
import { createScreenWrapper } from '@/test-utils/query-wrapper';

// 찜한 상품 목록이 **바깥에서 일어난 일**을 따라오는지 지킨다(#1099).
//
// 두 가지가 한꺼번에 어긋나 있었다.
//
//   ① 하트를 눌러도 안 꺼졌다      찜하기가 고치는 캐시 이름과 화면이 읽는 이름이 달랐다.
//                                화면은 필터 칩 때문에 `['my','favorites','ALL']` 을 읽는데
//                                `use-favorite.ts` 는 `['my','favorites']` 를 고쳤다.
//                                `setQueryData` 는 **이름이 통째로 같을 때만** 쓴다
//   ② 목록이 빈 채로 보였다        탭 목록은 다른 탭에 갔다 와도 화면이 다시 만들어지지 않아
//                                react-query 가 스스로 다시 부를 일이 없다. #932 에서 만든
//                                `useRefetchOnFocus` 가 마이 목록 셋에만 안 붙어 있었다
//
// ⚠️ **`app/` 안에 두지 않는다.** expo-router 는 `app/` 의 모든 파일을 화면으로 봐서
//    시험 파일까지 앱 번들에 끼워 넣으려다 실기기가 아예 안 뜬다(#857).

/**
 * 「상세에 갔다 돌아왔다」를 시험에서 만드는 손잡이.
 *
 * ⚠️ 이름이 `mock` 으로 시작해야 한다. jest 가 `jest.mock` 을 import 보다 먼저 올리는데,
 *    그 이름만 밖의 변수 참조가 허용된다(mobile/AGENTS.md).
 */
const mock초점 = { 돌아온다: () => {} };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  // 진짜는 화면에 초점이 올 때마다 부른다. 시험에서는 **그려지면 첫 초점**으로 보고,
  // 「갔다 돌아왔다」는 `mock초점.돌아온다()` 로 준다.
  // (`product-list-view.test.tsx` 와 같은 방식이다.)
  useFocusEffect: (callback: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect } = require('react') as typeof import('react');
    useEffect(() => {
      mock초점.돌아온다 = callback;
      callback();
    }, [callback]);
  },
}));

jest.mock('@/lib/my-lists', () => ({ fetchMyFavorites: jest.fn() }));
jest.mock('@/lib/favorites', () => ({ toggleFavorite: jest.fn() }));

const { fetchMyFavorites } = jest.requireMock('@/lib/my-lists') as {
  fetchMyFavorites: jest.Mock;
};
const { toggleFavorite } = jest.requireMock('@/lib/favorites') as { toggleFavorite: jest.Mock };

function 상품(id: number, title = `상품 ${id}`, isFavorite = true) {
  return {
    id,
    title,
    price: 10000,
    mainImageUrl: null,
    productStatus: 'NEW',
    productType: 'SELL',
    tradeStatus: 'SELLING',
    createdAt: '2026-08-06T00:00:00',
    viewCount: 0,
    favoriteCount: 3,
    isFavorite,
    addressSido: '서울',
    addressGugun: '은평구',
  };
}

/** 서버가 주는 한 페이지 봉투(`MyListPage`). `total` 은 첫 페이지에만 온다. */
function 한페이지(content: ReturnType<typeof 상품>[]) {
  return { content, hasNext: false, total: content.length };
}

// 이 화면은 `SafeAreaView` 를 쓴다 — 안전영역이 없으면 「No safe area value available」로 죽는다.
const 감싸기 = createScreenWrapper({ safeArea: true });

beforeEach(() => {
  useAuthStore.setState({ status: 'authed', accessToken: 'token', refreshToken: 'refresh' });
  jest.clearAllMocks();
});

describe('돌아왔을 때 다시 받기', () => {
  it('첫 초점에서는 다시 받지 않는다', async () => {
    // ⚠️ 화면이 막 만들어질 때도 초점은 온다. 그때 부르면 질의가 이미 보낸 요청과 겹쳐
    //    **들어올 때마다 요청이 두 번** 나간다(`use-refetch-on-focus.ts` 의 「첫 초점은 건너뛴다」).
    fetchMyFavorites.mockResolvedValue(한페이지([상품(1, '강아지 사료')]));

    await render(<FavoritesScreen />, { wrapper: 감싸기 });
    await waitFor(() => expect(screen.getByText('강아지 사료')).toBeTruthy());

    expect(fetchMyFavorites).toHaveBeenCalledTimes(1);
  });

  it('다른 화면에 갔다 돌아오면 목록을 다시 받는다', async () => {
    // 이것이 사용자가 본 증상이다 — 찜 목록을 열어둔 채 홈에서 상품을 찜하고 마이 탭으로
    // 돌아오면, 화면이 다시 만들어지지 않아 **빈 목록이 그대로 남아 있었다.**
    fetchMyFavorites.mockResolvedValue(한페이지([]));

    await render(<FavoritesScreen />, { wrapper: 감싸기 });
    await waitFor(() => expect(screen.getByText('찜한 상품이 없습니다')).toBeTruthy());

    // 홈에서 상품을 하나 찜하고 돌아온 셈이다.
    fetchMyFavorites.mockResolvedValue(한페이지([상품(1, '고양이 캣타워')]));
    mock초점.돌아온다();

    await waitFor(() => expect(screen.getByText('고양이 캣타워')).toBeTruthy());
  });
});

describe('목록에서 찜 빼기', () => {
  it('하트를 누르면 하트가 꺼진다', async () => {
    // ⚠️ **원인을 직접 보는 시험이다.** 찜하기가 고치는 캐시 이름이 화면이 읽는 이름과
    //    어긋나면 하트가 그대로 남는다 — 실기기에서 실제로 그랬다.
    //    문구는 `product-thumbnail.tsx` 의 `accessibilityLabel` 값이다.
    fetchMyFavorites.mockResolvedValue(한페이지([상품(1, '강아지 사료')]));
    toggleFavorite.mockResolvedValue(undefined);

    await render(<FavoritesScreen />, { wrapper: 감싸기 });
    await waitFor(() => expect(screen.getByText('강아지 사료')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('찜 해제'));

    await waitFor(() => expect(screen.getByLabelText('찜하기')).toBeTruthy());
  });

  it('찜을 빼도 항목은 목록에 남는다', async () => {
    // 잘못 눌렀을 때 되돌릴 수 있어야 하기 때문이다(찜 목록 설계 §5).
    // 그래서 찜하기는 이 목록을 **다시 받지 않는다** — 하트만 뒤집는다.
    fetchMyFavorites.mockResolvedValue(한페이지([상품(1, '강아지 사료')]));
    toggleFavorite.mockResolvedValue(undefined);

    await render(<FavoritesScreen />, { wrapper: 감싸기 });
    await waitFor(() => expect(screen.getByText('강아지 사료')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('찜 해제'));
    await waitFor(() => expect(screen.getByLabelText('찜하기')).toBeTruthy());

    expect(screen.getByText('강아지 사료')).toBeTruthy();
  });
});
