import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { UnderlineTabs } from './UnderlineTabs'

const meta = {
  title: 'Commons/UnderlineTabs',
  component: UnderlineTabs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof UnderlineTabs>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {
    tabs: [
      { id: 'tab1', label: '질문 있어요', code: 'tab1' },
      { id: 'tab2', label: '정보 공유', code: 'tab2' },
    ],
    activeTab: 'tab1',
    onTabChange: () => {},
    ariaLabel: '기본 탭',
  },
  render: (args) => {
    const [active, setActive] = useState(args.activeTab)
    const activeCode = args.tabs.find((t) => t.id === active)?.code ?? ''
    return (
      <div className="flex flex-col gap-4">
        <UnderlineTabs {...args} activeTab={active} onTabChange={setActive} />
        <div role="tabpanel" id={`panel-${activeCode}`} aria-labelledby={active} className="rounded-lg border p-4 text-sm text-gray-700">
          {active} 탭 콘텐츠
        </div>
      </div>
    )
  },
}

export const WithRightSlot: Story = {
  args: {
    tabs: [
      { id: 'sales', label: '판매 내역', code: 'sales' },
      { id: 'purchases', label: '구매 내역', code: 'purchases' },
      { id: 'wishlist', label: '찜한 상품', code: 'wishlist' },
    ],
    activeTab: 'sales',
    onTabChange: () => {},
    ariaLabel: '우측 슬롯 포함',
    rightSlot: (
      <a href="#" className="text-primary flex items-center gap-1 text-sm font-bold hover:underline">
        전체보기
        <ChevronRight size={16} />
      </a>
    ),
  },
  render: (args) => {
    const [active, setActive] = useState(args.activeTab)
    const activeCode = args.tabs.find((t) => t.id === active)?.code ?? ''
    return (
      <div className="flex flex-col gap-4">
        <UnderlineTabs {...args} activeTab={active} onTabChange={setActive} />
        <div role="tabpanel" id={`panel-${activeCode}`} aria-labelledby={active} className="rounded-lg border p-4 text-sm text-gray-700">
          {active} 탭 콘텐츠
        </div>
      </div>
    )
  },
}

export const ManyTabs: Story = {
  args: {
    tabs: [
      { id: 'all', label: '전체', code: 'all' },
      { id: 'mammal', label: '포유류', code: 'mammal' },
      { id: 'bird', label: '조류', code: 'bird' },
      { id: 'reptile', label: '파충류', code: 'reptile' },
      { id: 'fish', label: '수생동물', code: 'fish' },
    ],
    activeTab: 'all',
    onTabChange: () => {},
    ariaLabel: '여러 탭',
  },
  render: (args) => {
    const [active, setActive] = useState(args.activeTab)
    const activeCode = args.tabs.find((t) => t.id === active)?.code ?? ''
    return (
      <div className="flex flex-col gap-4">
        <UnderlineTabs {...args} activeTab={active} onTabChange={setActive} />
        <div role="tabpanel" id={`panel-${activeCode}`} aria-labelledby={active} className="rounded-lg border p-4 text-sm text-gray-700">
          {active} 탭 콘텐츠
        </div>
      </div>
    )
  },
}
