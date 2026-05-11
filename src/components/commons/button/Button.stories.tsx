import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Plus, Heart } from 'lucide-react'
import Button from './Button'

const meta = {
  title: 'Commons/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'ghost', 'link'] },
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { children: '기본 버튼' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: '고스트 버튼' },
}

export const Link: Story = {
  args: { variant: 'link', children: '링크 버튼' },
}

export const WithIcon: Story = {
  args: { icon: Plus, children: '아이콘 버튼' },
}

export const IconOnly: Story = {
  args: { icon: Heart, 'aria-label': '좋아요' },
}

export const PrimaryCTA: Story = {
  args: {
    children: '메인 CTA',
    className:
      'bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all',
  },
}

export const SecondaryAction: Story = {
  args: {
    children: '보조 액션',
    className:
      'border border-outline-variant/60 text-on-surface hover:bg-surface-container-high transition-all',
  },
}

export const Disabled: Story = {
  args: { children: '비활성화', disabled: true },
}
