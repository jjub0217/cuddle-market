import type { ProductDetailItem } from '@cuddle/shared';
import { render, screen, waitFor } from '@testing-library/react-native';

import ProductDetailScreen from '@/app/(tabs)/(home)/products/[id]';
import { createScreenWrapper } from '@/test-utils/query-wrapper';

// 상품 상세 **화면**의 시험.
//
// 여기서 지키는 것은 **꾹 눌러 고를 수 있는가**다(#991) — RN 의 <Text> 는 기본이
// 선택 불가라 꾹 눌러도 복사가 안 된다. 웹은 HTML 이라 저절로 되기 때문에
// 앱만 「고장」으로 보인다(#896·#988 과 같은 종류).
// 제목은 다른 곳에 검색해 보거나 옮겨 적을 값이고, 가격은 흥정·비교에 그대로 쓰는 값이다.
//
// ⚠️ 이 시험 파일은 **app/ 밖에** 둔다. expo-router 가 app/ 안의 모든 파일을 화면으로
//    보기 때문에, 거기 두면 실기기가 아예 안 뜬다(mobile/AGENTS.md).
//
// ⚠️ render 는 기다려야 한다(RNTL 14). 안 기다리면 «render function has not been called».

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: '1' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
  useSegments: () => ['(tabs)', '(home)', 'products', '[id]'],
}));

// 서버에서 받아 오는 것만 가로챈다. ProductNotFoundError 는 화면이 `instanceof` 로
// 판별하므로 진짜 것을 남겨 둔다 — 흉내로 덮으면 판별이 늘 거짓이 된다.
jest.mock('@/lib/products', () => ({
  ...jest.requireActual('@/lib/products'),
  fetchProductDetail: jest.fn(),
}));

// 내 상품인지 가르는 값. 남의 상품으로 둔다(로그인 안 한 상태와 같다).
jest.mock('@/hooks/use-me', () => ({
  useMe: () => ({ data: undefined }),
}));

const { fetchProductDetail } = jest.requireMock('@/lib/products') as {
  fetchProductDetail: jest.Mock;
};

const 상품: ProductDetailItem = {
  id: 1,
  productType: 'SELL',
  tradeStatus: 'SELLING',
  petDetailType: 'DOG',
  productStatus: 'NEW',
  title: '강아지 이동장 팝니다',
  price: 35000,
  mainImageUrl: 'https://cdn.example/1.webp',
  createdAt: '2026-08-19T00:00:00',
  favoriteCount: 3,
  isFavorite: false,
  viewCount: 12,
  category: '이동장',
  description: '한 번만 썼습니다. 가로 50 세로 30.',
  subImageUrls: [],
  addressSido: '서울시',
  addressGugun: '강남구',
  sellerInfo: {
    sellerId: 7,
    sellerNickname: '멍멍이집사',
    sellerProfileImageUrl: null,
    addressSido: '서울시',
    addressGugun: '강남구',
  },
  sellerOtherProducts: [],
};

// 안전영역 값과 QueryClient 설정은 mobile/test-utils/query-wrapper.tsx 로 모았다(#1059).
const 감싸기 = createScreenWrapper({ safeArea: true });

beforeEach(() => {
  fetchProductDetail.mockReset();
  fetchProductDetail.mockResolvedValue(상품);
});

it('제목과 가격은 꾹 눌러 고를 수 있다', async () => {
  await render(<ProductDetailScreen />, { wrapper: 감싸기 });

  // 조회가 끝나야 본문이 그려진다(그 전에는 회색 자리표시만 있다).
  await waitFor(() => expect(screen.getByText('강아지 이동장 팝니다')).toBeTruthy());

  expect(screen.getByText('강아지 이동장 팝니다').props.selectable).toBe(true);
  expect(screen.getByText('35,000원').props.selectable).toBe(true);
});

it('뱃지·시간·지역에는 selectable 을 달지 않는다', async () => {
  // 옮겨 적을 값이 아니고, 꾹 누르면 스크롤을 시작하려다 선택이 걸린다.
  await render(<ProductDetailScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(screen.getByText('강아지 이동장 팝니다')).toBeTruthy());

  expect(screen.getByText('판매').props.selectable).toBeFalsy();
  // ⚠️ 「서울시 강남구」만으로 찾으면 판매자 칸의 지역과 둘이 걸린다.
  //    요약 줄은 시간 뒤에 가운뎃점을 찍고 지역을 붙이므로 그 모양으로 가른다.
  expect(screen.getByText(/· 서울시 강남구$/).props.selectable).toBeFalsy();
});

it('빈 곳을 누르면 고른 글자가 풀리게 맨 바깥에서 누름을 구경한다', async () => {
  // 안드로이드의 글자 선택은 **그 글자가 초점을 잃을 때** 풀리는데 View·이미지는
  // 초점을 안 가져간다. 그래서 화면 맨 바깥에서 누름을 보고 있다가, 짧은 탭이면
  // selectable 글자를 다시 그려 선택을 푼다(hooks/use-selection-clear.ts).
  //
  // ⚠️ 누름을 **잡으면 안 된다** — 글자를 Pressable 로 감싸거나 부모에
  //    onStartShouldSetResponder 를 달면 꾹 누르기가 통째로 죽는다.
  //    onTouchStart/onTouchEnd 는 응답자(responder)를 안 가져가서 안전하다.
  // ⚠️ 예전에는 배경에 Pressable(absoluteFill)을 깔았는데, 배경은 「그 위에 아무 뷰도
  //    없는 자리」에서만 누름을 받아 실제로는 거의 안 먹었다. 그래서 지웠다(#991).
  await render(<ProductDetailScreen />, { wrapper: 감싸기 });
  await waitFor(() => expect(screen.getByText('강아지 이동장 팝니다')).toBeTruthy());

  const 맨바깥 = screen.getByTestId('product-detail-root');

  expect(typeof 맨바깥.props.onTouchStart).toBe('function');
  expect(typeof 맨바깥.props.onTouchEnd).toBe('function');
  // 잡는 처리기는 달려 있으면 안 된다.
  expect(맨바깥.props.onStartShouldSetResponder).toBeUndefined();

  // 「진짜로 선택이 풀리는가」는 시험이 못 본다 — 안드로이드 네이티브의 동작이라
  // 실기기로 확인한다(#991 의 사람 확인 항목).
});
