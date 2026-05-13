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
