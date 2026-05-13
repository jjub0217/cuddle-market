import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import WithdrawModal from './WithdrawModal'

const meta = {
  title: 'Commons/Modal/WithdrawModal',
  component: WithdrawModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof WithdrawModal>

export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    isOpen: true,
    onConfirm: () => {},
    onCancel: () => {},
  },
}

export const WithError: Story = {
  args: {
    isOpen: true,
    onConfirm: () => {},
    onCancel: () => {},
    error: (
      <div className="flex flex-col gap-0.5">
        <p className="text-base font-semibold">회원탈퇴에 실패했습니다.</p>
        <p>잠시 후 다시 시도해주세요.</p>
      </div>
    ),
    onClearError: () => {},
  },
}
