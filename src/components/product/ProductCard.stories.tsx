import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { Product } from '@/types/product'
import ProductCard from './ProductCard'

const baseProduct: Product = {
  id: 1,
  productType: 'SELL',
  tradeStatus: 'SELLING',
  petDetailType: 'DOG',
  productStatus: 'LIKE_NEW',
  title: '폭신폭신 프리미엄 원목 강아지 침대',
  price: 45000,
  mainImageUrl: '',
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  favoriteCount: 12,
  isFavorite: false,
  addressSido: '서울',
  addressGugun: '서초동',
  viewCount: 154,
}

const meta = {
  title: 'Product/ProductCard',
  component: ProductCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProductCard>

export default meta

type Story = StoryObj<typeof meta>

export const Selling: Story = {
  args: { data: baseProduct },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const Reserved: Story = {
  args: { data: { ...baseProduct, tradeStatus: 'RESERVED' } },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const Completed: Story = {
  args: { data: { ...baseProduct, tradeStatus: 'COMPLETED' } },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const PurchaseRequest: Story = {
  args: { data: { ...baseProduct, productType: 'REQUEST', tradeStatus: null } },
  parameters: {
    docs: {
      description: {
        story:
          '판매요청(`productType: REQUEST`) 카드는 **썸네일을 안 그린다**(#1109). 「구해요」 글의 사진은 내가 파는 물건이 아니라 남의 물건을 퍼온 예시라, 판매글 사진과 같은 자리에 두면 뜻이 어긋난다. 사진은 채팅으로 주고받게 한다. 썸네일 안에 있던 **찜 하트는 글자 영역 오른쪽 위로 옮겼다** — 요청 상품도 찜할 수 있고, 찜한 상품 목록에서 하트가 없으면 뺄 방법이 없어지기 때문이다. 사진 위가 아니라 흰 바탕이라 그림자를 안 깔고, 안 찜한 상태는 흰색 대신 회색이다.',
      },
    },
  },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const PurchaseRequestFavorited: Story = {
  args: { data: { ...baseProduct, productType: 'REQUEST', tradeStatus: null, isFavorite: true } },
  parameters: {
    docs: {
      description: {
        story: '찜한 판매요청 카드. 하트가 채워진다 — **찜한 상품 목록에서 뺄 수 있어야 해서** 이 단추가 꼭 필요하다.',
      },
    },
  },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const PurchaseRequestReserved: Story = {
  args: { data: { ...baseProduct, productType: 'REQUEST', tradeStatus: 'RESERVED' } },
  parameters: {
    docs: {
      description: {
        story:
          '썸네일이 없어지면 거기 얹혀 있던 **거래상태 오버레이**도 같이 사라진다. 그러면 「전체」로 볼 때 끝난 요청과 도는 요청이 똑같아 보여서, 요청 카드만 그 값을 뱃지 줄로 옮겨 먹색 알약으로 그린다. 「무슨 글자냐」는 공용 함수 `getTradeLabel`(원본 `packages/shared`)이 정하고 「그릴지 말지」는 카드가 정한다 — **판매중·요청중이면 안 그린다**(`PurchaseRequest` 스토리에 뱃지가 없는 까닭).',
      },
    },
  },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const PurchaseRequestCompleted: Story = {
  args: { data: { ...baseProduct, productType: 'REQUEST', tradeStatus: 'COMPLETED' } },
  parameters: {
    docs: {
      description: {
        story:
          '판매 글이면 「판매완료」지만 요청 글은 **「요청완료」**다. 웹의 `getTradeStatus` 는 요청 글을 몰라서 늘 「판매완료」를 주므로, 여기서는 `getTradeLabel` 을 쓴다.',
      },
    },
  },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const Vertical: Story = {
  args: { data: baseProduct, vertical: true },
  parameters: {
    docs: {
      description: {
        story:
          '`vertical=true` 는 카드를 모든 viewport에서 세로 레이아웃으로 강제합니다. 데스크탑(≥768px)에서는 기본 카드도 세로라 시각 차이가 없고, 차이는 **모바일(<768px)** 에서만 발생합니다 (기본: 가로 → vertical=true: 세로). 모바일 2-column grid 같은 좁은 영역에 카드를 넣을 때 사용합니다 (예: `UserPage`). `hideProductType` 은 별도 prop으로 독립 동작 — 뱃지 표시/숨김은 Controls로 토글하세요.',
      },
    },
  },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}
