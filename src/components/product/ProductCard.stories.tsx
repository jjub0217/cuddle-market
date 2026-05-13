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
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const HideProductType: Story = {
  args: { data: baseProduct, hideProductType: true },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}
