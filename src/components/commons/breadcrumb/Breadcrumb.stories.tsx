import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Breadcrumb from './Breadcrumb'

const meta = {
  title: 'Commons/Breadcrumb',
  component: Breadcrumb,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumb>

export default meta

type Story = StoryObj<typeof meta>

export const Single: Story = {
  args: {
    items: [{ label: '홈', href: '/' }],
  },
}

export const TwoLevel: Story = {
  args: {
    items: [
      { label: '홈', href: '/' },
      { label: '중고거래', href: '/market' },
    ],
  },
}

export const ThreeLevel: Story = {
  args: {
    items: [
      { label: '홈', href: '/' },
      { label: '중고거래', href: '/market' },
      { label: '사료/간식' },
    ],
  },
}

export const LongPath: Story = {
  args: {
    items: [
      { label: '홈', href: '/' },
      { label: '중고거래', href: '/market' },
      { label: '포유류', href: '/market?pet=mammal' },
      { label: '강아지', href: '/market?detail=dog' },
      { label: '사료/간식' },
    ],
  },
}
