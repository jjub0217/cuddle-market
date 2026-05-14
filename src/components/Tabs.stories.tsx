import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import Tabs from './Tabs'

const meta = {
  title: 'Commons/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'card-pill'] },
  },
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

const SAMPLE_TABS = [
  { id: 'tab-all', label: '전체', code: 'ALL' },
  { id: 'tab-question', label: '질문 있어요', code: 'QUESTION' },
  { id: 'tab-info', label: '정보 공유', code: 'INFO' },
] as const

export const Default: Story = {
  args: {
    tabs: SAMPLE_TABS,
    activeTab: 'tab-all',
    onTabChange: () => {},
    ariaLabel: '커뮤니티 분류',
    variant: 'default',
  },
  render: (args) => {
    const [active, setActive] = useState(args.activeTab)
    const activeCode = args.tabs.find((t) => t.id === active)?.code ?? ''
    return (
      <div className="flex flex-col gap-4">
        <Tabs {...args} activeTab={active} onTabChange={setActive} />
        <div role="tabpanel" id={`panel-${activeCode}`} aria-labelledby={active} className="rounded-lg border p-4 text-sm text-gray-700">
          {active} 탭 콘텐츠
        </div>
      </div>
    )
  },
}

export const CardPill: Story = {
  args: {
    tabs: [
      { id: 'tab-all', label: '전체', code: 'ALL' },
      { id: 'tab-selling', label: '판매중', code: 'SELLING' },
      { id: 'tab-reserved', label: '예약중', code: 'RESERVED' },
      { id: 'tab-completed', label: '판매완료', code: 'COMPLETED' },
    ],
    activeTab: 'tab-all',
    onTabChange: () => {},
    ariaLabel: '거래 상태',
    variant: 'card-pill',
  },
  render: (args) => {
    const [active, setActive] = useState(args.activeTab)
    const activeCode = args.tabs.find((t) => t.id === active)?.code ?? ''
    return (
      <div className="flex flex-col gap-4">
        <Tabs {...args} activeTab={active} onTabChange={setActive} />
        <div role="tabpanel" id={`panel-${activeCode}`} aria-labelledby={active} className="rounded-lg border p-4 text-sm text-gray-700">
          {active} 탭 콘텐츠
        </div>
      </div>
    )
  },
}
