import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { createRef } from 'react';
import type { ReactNode } from 'react';
import { getAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import {
  ProductListView,
  type ProductListViewRef,
} from '@/components/products/product-list-view';

// 홈에서 오려낸 조각이라 **전과 똑같이 도는지**가 핵심이다.
// 홈은 앱에서 가장 중요한 화면인데, 뜯어내면서 조용히 달라지면 알아채기 어렵다.

jest.mock('@/lib/products', () => ({ fetchProducts: jest.fn() }));
jest.mock('@/hooks/use-favorite', () => ({
  useFavorite: () => ({ toggle: jest.fn(), isPending: false }),
}));

/**
 * 초점을 시험에서 직접 준다.
 *
 * ⚠️ 이름이 **`mock` 으로 시작해야 한다.** 아니면 babel-plugin-jest-hoist 가
 *    `jest.mock` 안에서 밖의 변수를 못 읽게 막아 **파일이 아예 안 돈다.**
 */
const mock초점 = { 돌아온다: () => {} };

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  // 진짜는 화면에 초점이 올 때마다 부른다. 시험에서는 **그려지면 첫 초점**으로 보고,
  // 「상세에 갔다 돌아왔다」는 `mock초점.돌아온다()` 로 준다.
  //
  // ⚠️ 이 안에서는 위쪽 import 를 못 쓴다(jest 가 이 함수를 import 보다 먼저 올린다).
  //    react 는 여기서 다시 부른다.
  useFocusEffect: (callback: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect } = require('react') as typeof import('react');
    useEffect(() => {
      mock초점.돌아온다 = callback;
      callback();
    }, [callback]);
  },
}));

const { fetchProducts } = jest.requireMock('@/lib/products') as { fetchProducts: jest.Mock };

function 상품(id: number, title = `상품 ${id}`) {
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
    favoriteCount: 0,
    isFavorite: false,
    addressSido: '서울',
    addressGugun: '중구',
  };
}

function 한페이지(items: ReturnType<typeof 상품>[], hasNext = false) {
  return { content: items, hasNext, page: 0, size: 20, total: items.length };
}

// 세부 필터 시트가 쓰는 BottomSheet가 useSafeAreaInsets를 부른다. 시험에서는 재는 사람이
// 없어 「No safe area value available」로 터지므로, 값을 못 박아 감싸 준다(아이폰 14 기준).
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** 시험마다 새 클라이언트를 준다 — 앞 시험이 받아 둔 것을 물려받으면 안 된다. */
function 감싸기({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <SafeAreaProvider initialMetrics={METRICS}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
}

beforeEach(() => {
  fetchProducts.mockReset();
});

it('상품이 목록에 나온다', async () => {
  fetchProducts.mockResolvedValue(한페이지([상품(1, '강아지 사료'), 상품(2, '고양이 장난감')]));

  await render(<ProductListView />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText('강아지 사료')).toBeTruthy());
  expect(screen.getByText('고양이 장난감')).toBeTruthy();
});

it('조건이 없으면 검색어·필터를 안 보낸다 (홈)', async () => {
  fetchProducts.mockResolvedValue(한페이지([]));

  await render(<ProductListView />, { wrapper: 감싸기 });

  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  // 「전체」는 빈 값이라 키 자체가 안 실린다. 정렬만 늘 실린다(기본 최신순).
  expect(fetchProducts).toHaveBeenCalledWith({ page: 0, sortBy: 'createdAt' });
});

it('검색어를 받으면 그대로 서버에 넘긴다 (검색 결과)', async () => {
  fetchProducts.mockResolvedValue(한페이지([]));

  await render(<ProductListView keyword="강아지 사료" />, { wrapper: 감싸기 });

  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  expect(fetchProducts).toHaveBeenCalledWith(
    expect.objectContaining({ keyword: '강아지 사료' })
  );
});

it('목록이 비어도 대분류·필터·툴바가 다 보인다', async () => {
  // ⚠️ 소분류·카테고리 줄은 목록의 헤더다. 목록을 안 그리면 헤더도 안 그려져 조건을
  //    되돌릴 길이 없어지고 빈 화면에 갇힌다(2026-08-06 실기기에서 나온 것).
  //    그래서 **목록은 늘 그리고** 빈 화면은 그 안쪽(ListFooterComponent)에 넣는다.
  //    이 시험이 그걸 지킨다 — 빈 섹션에서도 헤더와 섹션 헤더가 그려지는가.
  //    대분류 탭은 목록 밖이라 목록과 상관없이 보여야 한다(#855 후속).
  fetchProducts.mockResolvedValue(한페이지([]));

  await render(<ProductListView />, { wrapper: 감싸기 });

  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  // 늘 고정되는 대분류 탭
  expect(screen.getByTestId('product-pet-type-tabs')).toBeTruthy();
  expect(screen.getByText('포유류')).toBeTruthy();
  // 목록 헤더인 소분류·카테고리 줄
  expect(screen.getByTestId('product-filter-row')).toBeTruthy();
  // 툴바도 보인다 — 종류·정렬을 되돌릴 길이다
  expect(screen.getByText('판매요청')).toBeTruthy();
  expect(screen.getByText('최신순')).toBeTruthy();
});

it('오류일 때도 대분류·필터·툴바가 다 보인다', async () => {
  fetchProducts.mockRejectedValue(new Error('그물이 끊겼어요'));

  await render(<ProductListView />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText('다시 시도')).toBeTruthy());
  expect(screen.getByTestId('product-pet-type-tabs')).toBeTruthy();
  expect(screen.getByText('포유류')).toBeTruthy();
  expect(screen.getByTestId('product-filter-row')).toBeTruthy();
  expect(screen.getByText('판매요청')).toBeTruthy();
});

it('대분류 탭은 목록 **밖**에 있고 소분류·카테고리는 목록 헤더 안에 있다', async () => {
  // ⚠️ 이 시험이 「대분류가 늘 고정된다」를 지킨다. `stickySectionHeadersEnabled`로
  //    붙는 것은 **섹션 헤더 하나(툴바)**뿐이라, 대분류를 남기려면 목록 밖에 두는 수밖에
  //    없다. 헤더 안으로 다시 들어가면 스크롤과 함께 사라진다.
  fetchProducts.mockResolvedValue(한페이지([상품(1)]));

  await render(<ProductListView />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());

  const 목록 = screen.getByTestId('product-list');
  expect(within(목록).queryByTestId('product-pet-type-tabs')).toBeNull();
  // 소분류·카테고리는 목록 안에 남아 있어야 한다 — 그래야 접힘 애니메이션이 산다
  expect(within(목록).getByTestId('product-filter-row')).toBeTruthy();
});

it('첫 조회가 실패하면 오류 안내를 보여준다', async () => {
  fetchProducts.mockRejectedValue(new Error('그물이 끊겼어요'));

  await render(<ProductListView />, { wrapper: 감싸기 });

  // ⚠️ /다시/ 로 찾으면 안내 문구(「…다시 시도해 주세요.」)와 단추가 둘 다 잡힌다.
  //    다시 눌러볼 길이 있는지가 핵심이므로 단추를 콕 집는다.
  await waitFor(() => expect(screen.getByText('다시 시도')).toBeTruthy());
  expect(screen.getByText('상품을 불러오지 못했어요.')).toBeTruthy();
});

it('알약을 고르면 그 조건으로 **처음부터** 다시 받는다', async () => {
  // ⚠️ 이 시험이 지키는 것은 queryKey 에 조건이 들어 있는가다.
  //    안 들어 있으면 이미 받아 둔 페이지를 그대로 써서, 필터를 바꿔도 목록이 안 바뀌거나
  //    2페이지부터 이어 받아 **뒤섞인 목록**이 된다(계획서 Task 4 경고).
  fetchProducts.mockResolvedValue(한페이지([상품(1)]));

  await render(<ProductListView />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  fetchProducts.mockClear();

  // 대분류 「포유류」를 고른다. 이름은 @cuddle/shared 의 PET_TYPE_OPTIONS 에서 온다.
  await fireEvent.press(screen.getByTestId('pet-type-tab-MAMMAL'));

  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  expect(fetchProducts).toHaveBeenCalledWith(
    // page 0 이어야 한다 — 이어 받으면 안 된다
    expect.objectContaining({ page: 0, petType: 'MAMMAL' })
  );
});

// ----- 목록이 비었을 때 뭐라고 하는가 -----
//
// 문구는 **웹에서 가져온 것이다** (ProductsSection.tsx:136).
// 웹은 검색과 필터를 안 나누므로 여기도 안 나눈다.
// 조건 없이 비었을 때만 앱이 원래 쓰던 홈 문구를 쓴다.

it('검색 결과가 비면 웹과 같은 문구를 쓴다', async () => {
  fetchProducts.mockResolvedValue(한페이지([]));

  await render(<ProductListView keyword="강아지 사료" />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText('검색 결과가 없습니다')).toBeTruthy());
  expect(screen.getByText('다른 필터 조건으로 검색해보세요')).toBeTruthy();
  // 홈 문구가 새어 나오면 안 된다
  expect(screen.queryByText(/아직 등록된 상품이 없어요/)).toBeNull();
});

it('필터 때문에 비어도 같은 문구다 (웹이 안 나눈다)', async () => {
  fetchProducts.mockResolvedValue(한페이지([]));

  await render(<ProductListView />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());

  await fireEvent.press(screen.getByTestId('pet-type-tab-MAMMAL'));

  await waitFor(() => expect(screen.getByText('검색 결과가 없습니다')).toBeTruthy());
  expect(screen.queryByText(/아직 등록된 상품이 없어요/)).toBeNull();
});

it('홈에 상품이 정말 없으면 홈 문구를 쓴다', async () => {
  fetchProducts.mockResolvedValue(한페이지([]));

  await render(<ProductListView />, { wrapper: 감싸기 });

  await waitFor(() => expect(screen.getByText(/아직 등록된 상품이 없어요/)).toBeTruthy());
});

// ----- 세부 조건이 서버까지 가는가 (#855) -----
//
// 조각들은 각자 자기 시험이 있다. 여기서 지키는 것은 **그 알림이 서버 요청까지 이어지는가**다.
// 중간에 하나만 끊겨도 「눌러도 목록이 그대로」가 된다.

it('판매요청을 고르면 productType이 실린다', async () => {
  fetchProducts.mockResolvedValue(한페이지([상품(1)]));

  await render(<ProductListView />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  fetchProducts.mockClear();

  await fireEvent.press(screen.getByTestId('product-type-REQUEST'));

  await waitFor(() =>
    expect(fetchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, productType: 'REQUEST' })
    )
  );
});

it('정렬을 바꾸면 서버가 받는 값으로 바뀌어 실린다', async () => {
  // 웹의 id(orderedLowPriced)가 아니라 sortBy=price + sortOrder=asc 로 가야 한다
  fetchProducts.mockResolvedValue(한페이지([상품(1)]));

  await render(<ProductListView />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  fetchProducts.mockClear();

  // ⚠️ **글자가 아니라 표식(testID)으로 누른다.** 글자는 단추 *안쪽*이라 누름이 단추까지
  //    안 올라갈 때가 있다 — 빠를 땐 통과하고 느릴 땐 「저가순을 못 찾겠다」로 깨진다.
  //    표식은 툴바가 이미 붙여 뒀다.
  await fireEvent.press(screen.getByTestId('open-sort'));
  await waitFor(() => expect(screen.getByTestId('sort-orderedLowPriced')).toBeTruthy());
  await fireEvent.press(screen.getByTestId('sort-orderedLowPriced'));

  await waitFor(() =>
    expect(fetchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'price', sortOrder: 'asc' })
    )
  );
});

it('대분류를 바꾸면 고른 소분류가 풀린 채로 요청된다', async () => {
  // ⚠️ 이 시험이 지키는 것은 **상태를 함수형으로 고치는가**다.
  //    필터 줄이 「소분류 풀기」와 「대분류 바꾸기」를 연달아 부르는데, 지금 값을 펴서
  //    쓰면 뒤엣것이 앞엣것을 덮어써서 푼 소분류가 되살아난다.
  //    그러면 「조류 + 강아지」처럼 서로 맞지 않는 조건이 서버로 간다.
  fetchProducts.mockResolvedValue(한페이지([상품(1)]));

  await render(<ProductListView />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());

  await fireEvent.press(screen.getByTestId('pet-type-tab-MAMMAL'));
  await waitFor(() => expect(screen.getByTestId('pet-detail-pill-DOG')).toBeTruthy());
  await fireEvent.press(screen.getByTestId('pet-detail-pill-DOG'));
  await waitFor(() =>
    expect(fetchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ petDetailType: 'DOG' })
    )
  );
  fetchProducts.mockClear();

  // 대분류만 조류로 바꾼다
  await fireEvent.press(screen.getByTestId('pet-type-tab-BIRD'));

  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  const 마지막 = fetchProducts.mock.calls.at(-1)?.[0];
  expect(마지막).toEqual(expect.objectContaining({ petType: 'BIRD' }));
  expect(마지막).not.toHaveProperty('petDetailType');
});

it('세부 필터 시트에서 적용하면 그 조건이 실린다', async () => {
  fetchProducts.mockResolvedValue(한페이지([상품(1)]));

  await render(<ProductListView />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  fetchProducts.mockClear();

  await fireEvent.press(screen.getByTestId('open-detail-filter'));
  // 시트가 그려지기를 기다린다(위 정렬 시험과 같은 이유)
  await waitFor(() => expect(screen.getByText('사용감 있음')).toBeTruthy());
  await fireEvent.press(screen.getByText('사용감 있음'));
  await fireEvent.press(screen.getByText('1만원~5만원'));
  await fireEvent.press(screen.getByText('적용'));

  await waitFor(() =>
    expect(fetchProducts).toHaveBeenCalledWith(
      expect.objectContaining({ productStatuses: 'USED', minPrice: 10000, maxPrice: 50000 })
    )
  );
});

// ----- 소분류 줄이 목록 화면 **안에서도** 움직이는가 -----
//
// 조각만 따로 그리는 product-filter-row.test.tsx 는 접힘·펼침을 다 통과한다.
// 그런데 실기기에서는 **접힐 때만** 툭 사라졌다(2026-08-06). 조각은 멀쩡한데 목록 화면에
// 얹으면 달라진다는 뜻이라, 여기서 따로 지킨다.

/** 소분류 줄의 지금 높이. 0이면 접혀 있다. Reanimated가 주는 값이라 애니메이션 도중 값이다. */
function 소분류줄높이() {
  const style = getAnimatedStyle(screen.getByTestId('pet-detail-collapse')) as { height: number };
  return style.height;
}

it('목록 화면 안에서도 소분류 줄이 접히는 모습이 보인다', async () => {
  fetchProducts.mockResolvedValue(한페이지([상품(1)]));

  await render(<ProductListView />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());

  // 펼친다
  await fireEvent.press(screen.getByTestId('pet-type-tab-MAMMAL'));
  await waitFor(() => expect(소분류줄높이()).toBeGreaterThan(0));

  // 「전체」로 돌아가 접는다
  await fireEvent.press(screen.getByTestId('pet-type-tab-ALL'));

  // ⚠️ 누른 **직후**에는 아직 줄어드는 중이어야 한다.
  //    여기서 0이면 애니메이션이 아예 안 돈 것이다 — 조각이 새로 태어나 접힌 자리에서
  //    시작했다는 뜻이고, 화면에서는 「갑자기 사라짐」으로 보인다.
  expect(소분류줄높이()).toBeGreaterThan(0);
});

it('reset() 하면 필터가 풀리고 조건 없이 다시 받는다', async () => {
  // 홈에서 **로고를 누르거나 홈 탭을 다시 누를 때** 부르는 길이다.
  // 이게 끊기면 필터로 결과가 0개일 때 「어떻게 벗어나지」가 된다
  // (2026-08-06 실기기에서 나온 것).
  const ref = createRef<ProductListViewRef>();
  fetchProducts.mockResolvedValue(한페이지([]));

  await render(<ProductListView ref={ref} />, { wrapper: 감싸기 });
  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());

  await fireEvent.press(screen.getByTestId('pet-type-tab-MAMMAL'));
  await waitFor(() =>
    expect(fetchProducts).toHaveBeenCalledWith(expect.objectContaining({ petType: 'MAMMAL' }))
  );
  fetchProducts.mockClear();

  await act(async () => {
    ref.current?.reset();
  });

  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  expect(fetchProducts).toHaveBeenCalledWith({ page: 0, sortBy: 'createdAt' });
});

// 상품을 보고 돌아오면 그 상품의 조회수가 달라져 있다. 목록은 탭 화면이라 다시 안 만들어져서
// 우리가 안 부르면 **옛 숫자가 그대로 남는다**(#932).
it('상세를 보고 돌아오면 목록을 다시 부른다', async () => {
  fetchProducts.mockResolvedValue(한페이지([상품(1, '강아지 사료')]));

  await render(<ProductListView />, { wrapper: 감싸기 });
  await waitFor(() => expect(screen.getByText('강아지 사료')).toBeTruthy());

  // 첫 초점에서는 안 부른다 — 질의가 이미 한 번 불렀다. 여기서 부르면 홈을 열 때마다
  // 요청이 두 번 나간다.
  expect(fetchProducts).toHaveBeenCalledTimes(1);

  await act(async () => {
    mock초점.돌아온다();
  });

  await waitFor(() => expect(fetchProducts).toHaveBeenCalledTimes(2));
});
