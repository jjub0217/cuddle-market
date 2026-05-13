import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SellerAvatar } from './SellerAvatar'

const meta = {
  title: 'Commons/SellerAvatar',
  component: SellerAvatar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof SellerAvatar>

export default meta

type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: { nickname: '행복한집사', size: 'sm' },
}

export const Medium: Story = {
  args: { nickname: '행복한집사', size: 'md' },
}

export const Large: Story = {
  args: { nickname: '행복한집사', size: 'lg' },
}

export const FallbackInitial: Story = {
  args: { nickname: 'B', size: 'md' },
}
