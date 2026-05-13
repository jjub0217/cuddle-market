import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Info } from 'lucide-react'
import AlertBox from './AlertBox'

const meta = {
  title: 'Commons/Modal/AlertBox',
  component: AlertBox,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof AlertBox>

export default meta

type Story = StoryObj<typeof meta>

export const SingleItem: Story = {
  args: {
    alertList: ['삭제된 상품은 복구할 수 없습니다'],
  },
  decorators: [
    (StoryFn) => (
      <div className="w-96">
        <StoryFn />
      </div>
    ),
  ],
}

export const MultipleItems: Story = {
  args: {
    alertList: [
      '등록한 모든 상품이 삭제됩니다',
      '거래 내역과 채팅 기록이 모두 삭제됩니다',
      '찜한 상품 목록이 삭제됩니다',
      '진행 중인 거래가 있다면 먼저 완료해 주세요',
    ],
  },
  decorators: [
    (StoryFn) => (
      <div className="w-96">
        <StoryFn />
      </div>
    ),
  ],
}

export const InfoTone: Story = {
  args: {
    alertList: ['이 작업은 되돌릴 수 없습니다'],
    title: '안내사항',
    icon: Info,
    iconColor: 'text-primary',
    bgColor: 'bg-primary-50',
    borderColor: 'border-primary-100',
    titleColor: 'text-primary',
    listColor: 'text-on-surface',
  },
  decorators: [
    (StoryFn) => (
      <div className="w-96">
        <StoryFn />
      </div>
    ),
  ],
}
