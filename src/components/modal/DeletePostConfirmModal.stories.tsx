import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import DeletePostConfirmModal from './DeletePostConfirmModal'

const meta = {
  title: 'Commons/Modal/DeletePostConfirmModal',
  component: DeletePostConfirmModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof DeletePostConfirmModal>

export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    isOpen: true,
    postId: 1,
    onConfirm: () => {},
    onCancel: () => {},
  },
}

export const WithError: Story = {
  args: {
    isOpen: true,
    postId: 1,
    onConfirm: () => {},
    onCancel: () => {},
    error: (
      <div className="flex flex-col gap-0.5">
        <p className="text-base font-semibold">게시글 삭제에 실패했습니다.</p>
        <p>잠시 후 다시 시도해주세요.</p>
      </div>
    ),
    onClearError: () => {},
  },
}
