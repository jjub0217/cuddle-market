import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ModalTitle from './ModalTitle'

const meta = {
  title: 'Commons/Modal/ModalTitle',
  component: ModalTitle,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ModalTitle>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { heading: '상품 삭제', description: '정말로 이 상품을 삭제하시겠습니까?' },
}

export const Withdraw: Story = {
  args: { heading: '회원 탈퇴', description: '탈퇴 후에는 복구할 수 없습니다.' },
}

export const RichDescription: Story = {
  args: {
    heading: '게시글 신고',
    description: (
      <div className="flex flex-col gap-1 text-sm text-gray-600">
        <p>신고 사유를 선택해주세요.</p>
        <p>신고는 익명으로 처리됩니다.</p>
      </div>
    ),
  },
}
