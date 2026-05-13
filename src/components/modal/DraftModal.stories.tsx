import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import DraftModal from './DraftModal'

const meta = {
  title: 'Commons/Modal/DraftModal',
  component: DraftModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof DraftModal>

export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    initialBoardType: 'QUESTION',
    showDraftModal: true,
    setIsDraftChecked: () => {},
    setShowDraftModal: () => {},
    clearDraft: () => {},
    getSavedDraft: () => ({
      boardType: 'QUESTION',
      title: '임시저장된 제목',
      content: '임시저장된 본문',
    }),
    reset: () => {},
  },
}
