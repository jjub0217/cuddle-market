import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Package, Heart, Search, MessageSquare } from 'lucide-react'
import EmptyState from './EmptyState'

const meta = {
  title: 'Commons/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>

export default meta

type Story = StoryObj<typeof meta>

export const NoProducts: Story = {
  args: {
    icon: Package,
    title: '등록한 상품이 없습니다',
    description: '상품을 등록해보세요',
  },
}

export const NoFavorites: Story = {
  args: {
    icon: Heart,
    title: '찜한 상품이 없습니다',
    description: '마음에 드는 상품을 찜해보세요',
  },
}

export const NoSearchResults: Story = {
  args: {
    icon: Search,
    title: '검색 결과가 없습니다',
    description: '다른 키워드로 검색해보세요',
  },
}

export const NoMessages: Story = {
  args: {
    icon: MessageSquare,
    title: '대화 중인 채팅이 없습니다',
  },
}
