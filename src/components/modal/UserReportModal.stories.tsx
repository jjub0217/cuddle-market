import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import UserReportModal from './UserReportModal'

const meta = {
  title: 'Commons/Modal/UserReportModal',
  component: UserReportModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof UserReportModal>

export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    isOpen: true,
    userNickname: '행복한집사',
    userId: 1,
    onCancel: () => {},
  },
}
