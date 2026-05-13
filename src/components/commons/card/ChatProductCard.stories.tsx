import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ChatProductCard from './ChatProductCard'

const meta = {
  title: 'Commons/ChatProductCard',
  component: ChatProductCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof ChatProductCard>

export default meta

type Story = StoryObj<typeof meta>

const baseArgs = {
  productTitle: '폭신폭신 프리미엄 원목 강아지 침대',
  productPrice: 45000,
}

export const Small: Story = {
  args: { ...baseArgs, size: 'sm' },
  decorators: [
    (StoryFn) => (
      <div className="border-outline-variant/40 flex w-72 items-center gap-2 rounded-lg border bg-white p-2">
        <StoryFn />
      </div>
    ),
  ],
}

export const Medium: Story = {
  args: { ...baseArgs, size: 'md' },
  decorators: [
    (StoryFn) => (
      <div className="border-outline-variant/40 flex w-80 items-center gap-3 rounded-lg border bg-white p-3">
        <StoryFn />
      </div>
    ),
  ],
}

export const NoImage: Story = {
  args: { ...baseArgs, size: 'sm' },
  decorators: [
    (StoryFn) => (
      <div className="border-outline-variant/40 flex w-72 items-center gap-2 rounded-lg border bg-white p-2">
        <StoryFn />
      </div>
    ),
  ],
}
