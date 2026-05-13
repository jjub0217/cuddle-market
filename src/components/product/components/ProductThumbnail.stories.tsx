import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { ProductThumbnail } from './ProductThumbnail'

const meta = {
  title: 'Product/ProductThumbnail',
  component: ProductThumbnail,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProductThumbnail>

export default meta

type Story = StoryObj<typeof meta>

const baseArgs = {
  imageUrl: '',
  title: '폭신폭신 프리미엄 원목 강아지 침대',
  productTypeName: '판매',
  tradeStatus: '판매중' as string | null,
  isFavorite: false,
  onLikeClick: () => {},
}

export const Selling: Story = {
  args: baseArgs,
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const Reserved: Story = {
  args: { ...baseArgs, tradeStatus: '예약중' },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const Completed: Story = {
  args: { ...baseArgs, tradeStatus: '판매완료' },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const RequestPending: Story = {
  args: { ...baseArgs, productTypeName: '판매요청', tradeStatus: null },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const RequestCompleted: Story = {
  args: { ...baseArgs, productTypeName: '판매요청', tradeStatus: '판매완료' },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}

export const Favorited: Story = {
  args: baseArgs,
  render: (args) => {
    const [favorite, setFavorite] = useState(true)
    return (
      <div className="w-72">
        <ProductThumbnail {...args} isFavorite={favorite} onLikeClick={() => setFavorite((prev) => !prev)} />
      </div>
    )
  },
}

export const Vertical: Story = {
  args: { ...baseArgs, vertical: true },
  decorators: [
    (StoryFn) => (
      <div className="w-72">
        <StoryFn />
      </div>
    ),
  ],
}
