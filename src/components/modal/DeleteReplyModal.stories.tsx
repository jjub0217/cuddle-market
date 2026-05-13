import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import DeleteReplyModal from './DeleteReplyModal'

const meta = {
  title: 'Commons/Modal/DeleteReplyModal',
  component: DeleteReplyModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof DeleteReplyModal>

export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    isOpen: true,
    replyId: 1,
    onCancel: () => {},
    onConfirm: async () => {},
  },
}
