import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ProductListView } from '@/components/products/product-list-view';

// 홈에서 오려낸 조각이라 **전과 똑같이 도는지**가 핵심이다.
// 홈은 앱에서 가장 중요한 화면인데, 뜯어내면서 조용히 달라지면 알아채기 어렵다.

jest.mock('@/lib/products', () => ({ fetchProducts: jest.fn() }));
jest.mock('@/hooks/use-favorite', () => ({
  useFavorite: () => ({ toggle: jest.fn(), isPending: false }),
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

/** 시험마다 새 클라이언트를 준다 — 앞 시험이 받아 둔 것을 물려받으면 안 된다. */
function 감싸기({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
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
  expect(fetchProducts).toHaveBeenCalledWith({
    page: 0,
    keyword: undefined,
    petType: undefined,
    categories: undefined,
  });
});

it('검색어를 받으면 그대로 서버에 넘긴다 (검색 결과)', async () => {
  fetchProducts.mockResolvedValue(한페이지([]));

  await render(<ProductListView keyword="강아지 사료" />, { wrapper: 감싸기 });

  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  expect(fetchProducts).toHaveBeenCalledWith(
    expect.objectContaining({ keyword: '강아지 사료' })
  );
});

it('목록이 비어도 알약은 보인다', async () => {
  // 알약이 사라지면 조건을 되돌릴 방법이 없어진다 — 빈 화면에 갇힌다.
  fetchProducts.mockResolvedValue(한페이지([]));

  await render(<ProductListView />, { wrapper: 감싸기 });

  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  // 「전체」는 두 줄 모두에 있다(대분류·카테고리).
  expect(screen.getAllByText('전체').length).toBeGreaterThanOrEqual(2);
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
  await fireEvent.press(screen.getByText('포유류'));

  await waitFor(() => expect(fetchProducts).toHaveBeenCalled());
  expect(fetchProducts).toHaveBeenCalledWith(
    // page 0 이어야 한다 — 이어 받으면 안 된다
    expect.objectContaining({ page: 0, petType: 'MAMMAL' })
  );
});
