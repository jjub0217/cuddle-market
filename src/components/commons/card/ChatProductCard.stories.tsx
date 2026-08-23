import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ChatProductCard from './ChatProductCard'

const meta = {
  title: 'Commons/ChatProductCard',
  component: ChatProductCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof ChatProductCard>

export default meta

type Story = StoryObj<typeof meta>

const baseArgs = {
  productImageUrl: '/images/category/house.webp',
  productTitle: '폭신폭신 프리미엄 원목 강아지 침대',
  productPrice: 45000,
}

export const Small: Story = {
  args: { ...baseArgs, size: 'sm' },
  decorators: [
    (StoryFn) => (
      <div className="border-outline-variant/40 flex w-72 items-center gap-2 rounded-lg border bg-white p-2">
        <StoryFn />
      </div>
    ),
  ],
}

export const Medium: Story = {
  args: { ...baseArgs, size: 'md' },
  decorators: [
    (StoryFn) => (
      <div className="border-outline-variant/40 flex w-80 items-center gap-3 rounded-lg border bg-white p-3">
        <StoryFn />
      </div>
    ),
  ],
}

export const NoImage: Story = {
  args: { ...baseArgs, size: 'sm', productImageUrl: undefined },
  decorators: [
    (StoryFn) => (
      <div className="border-outline-variant/40 flex w-72 items-center gap-2 rounded-lg border bg-white p-2">
        <StoryFn />
      </div>
    ),
  ],
}

/**
 * 거래 상태 뱃지(#1035). 네 경우를 나란히 둔다.
 *
 * ⚠️ **`md`(64px)만 둔다.** 뱃지를 실제로 쓰는 곳은 채팅방 **안**(`ChatRoomInfo`)뿐이고
 *    거기가 `md` 다. 채팅방 **목록**(`sm`, 40px)은 아직 거래 상태를 안 넘긴다 —
 *    나중에 붙이게 되면 그때 그 크기로 다시 재서 정한다.
 */
export const TradeStatusBadge: Story = {
  name: '거래 상태 뱃지',
  args: { ...baseArgs, size: 'md', tradeStatus: 'COMPLETED' },
  // 네 경우를 한 번에 보려고 데코레이터 안에서 직접 넷을 그린다 — 그래서 StoryFn 은 안 쓴다
  decorators: [
    () => (
      <div className="flex flex-col gap-2">
        {([undefined, 'SELLING', 'RESERVED', 'COMPLETED'] as const).map((tradeStatus) => (
          <div
            key={String(tradeStatus)}
            className="border-outline-variant/40 flex w-80 items-center gap-3 rounded-lg border bg-white p-3"
          >
            <ChatProductCard {...baseArgs} size="md" tradeStatus={tradeStatus} />
          </div>
        ))}
      </div>
    ),
  ],
}
