import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Badge from './Badge'

const meta = {
  title: 'Commons/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: '판매중' },
}

export const Primary: Story = {
  args: { children: '판매중', className: 'bg-primary text-white' },
}

export const Reserved: Story = {
  args: { children: '예약중', className: 'bg-secondary-container text-on-secondary-container' },
}

export const Completed: Story = {
  args: { children: '판매완료', className: 'bg-surface-container-high text-on-surface-muted' },
}

export const Outline: Story = {
  args: { children: '새 상품', className: 'border border-outline-variant/60 bg-transparent text-on-surface' },
}
