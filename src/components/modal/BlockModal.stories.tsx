import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import BlockModal from './BlockModal'

const meta = {
  title: 'Commons/Modal/BlockModal',
  component: BlockModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof BlockModal>

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

export const MaxLengthNickname: Story = {
  args: {
    isOpen: true,
    userNickname: '긴닉네임을가진사용자', // 닉네임 정책 최대치 10자 (validationRules: 2~10자)
    userId: 2,
    onCancel: () => {},
  },
}
