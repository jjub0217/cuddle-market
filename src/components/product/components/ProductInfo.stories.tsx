import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ProductInfo } from './ProductInfo'

const meta = {
  title: 'Product/ProductInfo',
  component: ProductInfo,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProductInfo>

export default meta

type Story = StoryObj<typeof meta>

const baseArgs = {
  title: '폭신폭신 프리미엄 원목 강아지 침대',
  price: 45000,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  favoriteCount: 12,
  productTypeName: '판매',
  productStatusName: '거의 새것',
  isFavorite: false,
  location: '서초동',
}

export const Selling: Story = {
  args: baseArgs,
  decorators: [
    (StoryFn) => (
      <div className="w-72 rounded-2xl border border-black/5 bg-white">
        <StoryFn />
      </div>
    ),
  ],
}

export const PurchaseRequest: Story = {
  args: { ...baseArgs, productTypeName: '판매요청' },
  decorators: [
    (StoryFn) => (
      <div className="w-72 rounded-2xl border border-black/5 bg-white">
        <StoryFn />
      </div>
    ),
  ],
}

export const HideProductType: Story = {
  args: { ...baseArgs, hideProductType: true },
  decorators: [
    (StoryFn) => (
      <div className="w-72 rounded-2xl border border-black/5 bg-white">
        <StoryFn />
      </div>
    ),
  ],
}

export const NoLocation: Story = {
  args: { ...baseArgs, location: '' },
  decorators: [
    (StoryFn) => (
      <div className="w-72 rounded-2xl border border-black/5 bg-white">
        <StoryFn />
      </div>
    ),
  ],
}

export const HighFavorite: Story = {
  args: { ...baseArgs, favoriteCount: 999 },
  decorators: [
    (StoryFn) => (
      <div className="w-72 rounded-2xl border border-black/5 bg-white">
        <StoryFn />
      </div>
    ),
  ],
}
