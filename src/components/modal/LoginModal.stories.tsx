import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import LoginModal from './LoginModal'
import { useLoginModalStore } from '@/store/modalStore'

const meta = {
  title: 'Commons/Modal/LoginModal',
  component: LoginModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof LoginModal>

export default meta

type Story = StoryObj<typeof meta>

export const LoginPrompt: Story = {
  decorators: [
    (StoryFn) => {
      useLoginModalStore.setState({
        isOpen: true,
        modalType: 'login',
        closeModal: () => {},
        onConfirm: () => {},
      })
      return <StoryFn />
    },
  ],
}

export const LogoutPrompt: Story = {
  decorators: [
    (StoryFn) => {
      useLoginModalStore.setState({
        isOpen: true,
        modalType: 'logout',
        closeModal: () => {},
        onConfirm: () => {},
      })
      return <StoryFn />
    },
  ],
}
