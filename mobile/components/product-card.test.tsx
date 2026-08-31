import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import type { Product } from '@cuddle/shared';

import { ProductCard } from './product-card';
import { THUMB_TEST_ID } from './product-thumbnail';

// 판매요청 카드는 썸네일을 안 그린다(#1109).
// 썸네일 안에 있던 것 둘이 같이 사라지는데, 그 둘을 어떻게 살렸는지가 여기서 지킬 것이다.
//   1. 썸네일 자리가 판매요청에서만 사라진다 — 판매 카드는 그대로다
//   2. 거래상태(요청완료 · 예약중)가 뱃지 줄로 옮겨 갔다
//   3. 찜 하트가 글자 영역 오른쪽 위로 옮겨 갔고 **눌린다**
//
// ⚠️ **하트가 눌리는가**를 굳이 재는 까닭: 웹 쪽 같은 변경에서 하트 위를 다른 상자가 덮어
//    「보이는데 안 눌리는」 버그가 났다(크롬 실측). 앱은 RN 이라 누름을 안 잡는 View 는
//    막지 않지만, 그래도 **핸들러가 이어져 있는가**는 시험이 지킬 수 있다.
//    ⚠️ 다만 **겹침 자체는 jest 가 못 잰다** — 배치는 실기기로 봐야 한다(mobile/AGENTS.md).
//
// ⚠️ @testing-library/react-native 14 의 render·fireEvent 는 기다려야 한다.
//    안 기다리면 fireEvent 는 오류 없이 옛 값을 준다 — 조용히 틀린 것을 통과시킨다.

function 상품(덮어쓰기: Partial<Product> = {}): Product {
  return {
    id: 1,
    productType: 'SELL',
    tradeStatus: 'SELLING',
    petDetailType: 'DOG_SMALL',
    productStatus: 'USED',
    title: '개구리 사료',
    price: 12000,
    mainImageUrl: 'https://cdn/x.webp',
    createdAt: new Date().toISOString(),
    favoriteCount: 3,
    isFavorite: false,
    addressGugun: '은평구',
    ...덮어쓰기,
  };
}

describe('썸네일 자리', () => {
  it('판매 카드는 썸네일을 그린다', async () => {
    await render(<ProductCard product={상품()} />);

    expect(screen.getByTestId(THUMB_TEST_ID)).toBeTruthy();
  });

  it('판매요청 카드는 썸네일을 안 그린다', async () => {
    await render(<ProductCard product={상품({ productType: 'REQUEST', tradeStatus: null })} />);

    expect(screen.queryByTestId(THUMB_TEST_ID)).toBeNull();
    // 카드 자체는 그대로 그려진다 — 사라지는 것은 사진 자리뿐이다.
    expect(screen.getByText('개구리 사료')).toBeTruthy();
    expect(screen.getByText('판매요청')).toBeTruthy();
  });
});

describe('거래상태', () => {
  it('요청완료면 뱃지 줄에 글자로 그린다', async () => {
    await render(
      <ProductCard product={상품({ productType: 'REQUEST', tradeStatus: 'COMPLETED' })} />,
    );

    // 썸네일 위 흰 알약이 하던 몫이다. 문구는 공용 getTradeLabel 이 정한다 — REQUEST 는 「요청완료」.
    expect(screen.getByText('요청완료')).toBeTruthy();
  });

  it('요청중이면 아무것도 안 그린다', async () => {
    await render(<ProductCard product={상품({ productType: 'REQUEST', tradeStatus: null })} />);

    // getOverlay 가 null 을 주는 자리다(판매중 · 요청중). 썸네일도 그때는 오버레이를 안 그렸다.
    expect(screen.queryByText('요청중')).toBeNull();
    expect(screen.queryByText('요청완료')).toBeNull();
  });

  it('판매 카드에는 거래상태 뱃지를 안 그린다 — 썸네일 오버레이가 그대로 맡는다', async () => {
    await render(<ProductCard product={상품({ tradeStatus: 'COMPLETED' })} />);

    // 썸네일 안의 알약으로는 그려지므로 「없다」가 아니라 「뱃지 줄로 옮기지 않았다」를 본다.
    // 알약과 뱃지를 글자로는 못 가르니, 썸네일이 살아 있는 것으로 갈음한다.
    expect(screen.getByTestId(THUMB_TEST_ID)).toBeTruthy();
    expect(screen.getAllByText('판매완료')).toHaveLength(1);
  });
});

describe('판매요청 카드의 찜 하트', () => {
  it('누르면 onToggle 이 불린다', async () => {
    const 켜고끄기 = jest.fn();
    await render(
      <ProductCard
        product={상품({ productType: 'REQUEST', tradeStatus: null })}
        favorite={{ isFavorite: false, onToggle: 켜고끄기 }}
      />,
    );

    await fireEvent.press(screen.getByLabelText('찜하기'));

    expect(켜고끄기).toHaveBeenCalledTimes(1);
  });

  it('찜한 상태면 라벨이 「찜 해제」다 — 목록에서 뺄 수 있어야 한다', async () => {
    await render(
      <ProductCard
        product={상품({ productType: 'REQUEST', tradeStatus: null, isFavorite: true })}
        favorite={{ isFavorite: true, onToggle: jest.fn() }}
      />,
    );

    expect(screen.getByLabelText('찜 해제')).toBeTruthy();
  });

  it('찜을 안 넘기는 화면에는 하트가 없다', async () => {
    await render(<ProductCard product={상품({ productType: 'REQUEST', tradeStatus: null })} />);

    expect(screen.queryByLabelText('찜하기')).toBeNull();
  });
});
