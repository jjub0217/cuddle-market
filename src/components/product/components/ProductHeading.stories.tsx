import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ProductHeading } from './ProductHeading'

const meta = {
  title: 'Product/ProductHeading',
  component: ProductHeading,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProductHeading>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { title: '폭신폭신 프리미엄 원목 강아지 침대', price: 45000 },
  decorators: [
    (StoryFn) => (
      <div className="w-60">
        <StoryFn />
      </div>
    ),
  ],
}

export const LongTitle: Story = {
  args: { title: '아주 긴 상품 제목 line-clamp 처리 확인용 더미 데이터 입니다', price: 12000 },
  decorators: [
    (StoryFn) => (
      <div className="w-60">
        <StoryFn />
      </div>
    ),
  ],
}

export const HighPrice: Story = {
  args: { title: '명품 반려동물 가구', price: 1234567 },
  decorators: [
    (StoryFn) => (
      <div className="w-60">
        <StoryFn />
      </div>
    ),
  ],
}
