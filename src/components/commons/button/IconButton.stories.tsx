import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Heart, Bell, Search } from 'lucide-react'
import IconButton from './IconButton'

const meta = {
  title: 'Commons/IconButton',
  component: IconButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof IconButton>

export default meta

type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: {
    size: 'sm',
    'aria-label': '검색',
    children: <Search size={16} />,
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
    'aria-label': '알림',
    children: <Bell size={20} />,
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    'aria-label': '찜하기',
    children: <Heart size={24} />,
  },
}
