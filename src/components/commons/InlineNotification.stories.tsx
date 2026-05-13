import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import InlineNotification from './InlineNotification'

const meta = {
  title: 'Commons/InlineNotification',
  component: InlineNotification,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'inline-radio', options: ['success', 'error', 'warning'] },
  },
} satisfies Meta<typeof InlineNotification>

export default meta

type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: {
    type: 'success',
    onClose: () => {},
    durationMs: 60000,
    children: <p className="font-semibold">상품을 성공적으로 등록했습니다.</p>,
  },
  render: (args) => (
    <div className="w-80">
      <InlineNotification {...args} />
    </div>
  ),
}

export const Error: Story = {
  args: {
    type: 'error',
    onClose: () => {},
    durationMs: 60000,
    children: (
      <div className="flex flex-col gap-0.5">
        <p className="text-base font-semibold">상품 삭제에 실패했습니다.</p>
        <p>잠시 후 다시 시도해주세요.</p>
      </div>
    ),
  },
  render: (args) => (
    <div className="w-80">
      <InlineNotification {...args} />
    </div>
  ),
}

export const Warning: Story = {
  args: {
    type: 'warning',
    onClose: () => {},
    durationMs: 60000,
    children: <p className="font-semibold">진행 중인 거래가 있습니다. 먼저 완료해주세요.</p>,
  },
  render: (args) => (
    <div className="w-80">
      <InlineNotification {...args} />
    </div>
  ),
}
