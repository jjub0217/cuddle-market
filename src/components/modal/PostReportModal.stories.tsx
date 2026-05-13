import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PostReportModal from './PostReportModal'

const meta = {
  title: 'Commons/Modal/PostReportModal',
  component: PostReportModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof PostReportModal>

export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    isOpen: true,
    postId: 1,
    authorNickname: '행복한집사',
    postTitle: '강아지 산책 시간 어느 정도가 좋을까요?',
    onCancel: () => {},
  },
}
