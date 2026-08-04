import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Info } from 'lucide-react'
import AlertBox from './AlertBox'
import { WITH_DRAW_ALERT_LIST } from '@/constants/constants'

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

// 실제 탈퇴 안내를 그대로 쓴다. 문구를 여기 베껴 두면 화면과 이야기가 갈린다 —
// 실제로 #832에서 세 줄을 고칠 때 이 파일에만 옛 문구가 남아 있었다.
export const MultipleItems: Story = {
  args: {
    alertList: WITH_DRAW_ALERT_LIST,
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
