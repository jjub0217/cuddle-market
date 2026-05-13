import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ToastNotification from './ToastNotification'

const meta = {
  title: 'Commons/ToastNotification',
  component: ToastNotification,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'inline-radio', options: ['success', 'error', 'warning'] },
  },
} satisfies Meta<typeof ToastNotification>

export default meta

type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: {
    type: 'success',
    title: '상품 등록 완료',
    children: '상품이 성공적으로 등록되었습니다.',
    durationMs: 60000,
    showBar: true,
    onClose: () => {},
  },
  decorators: [
    (StoryFn) => (
      <div className="w-80">
        <StoryFn />
      </div>
    ),
  ],
}

export const Error: Story = {
  args: {
    type: 'error',
    title: '오류',
    children: '잠시 후 다시 시도해주세요.',
    durationMs: 60000,
    showBar: true,
    onClose: () => {},
  },
  decorators: [
    (StoryFn) => (
      <div className="w-80">
        <StoryFn />
      </div>
    ),
  ],
}

export const Warning: Story = {
  args: {
    type: 'warning',
    title: '주의',
    children: '진행 중인 거래가 있습니다.',
    durationMs: 60000,
    showBar: true,
    onClose: () => {},
  },
  decorators: [
    (StoryFn) => (
      <div className="w-80">
        <StoryFn />
      </div>
    ),
  ],
}

export const TitleOnly: Story = {
  args: {
    type: 'success',
    title: '저장 완료',
    durationMs: 60000,
    showBar: false,
    onClose: () => {},
  },
  decorators: [
    (StoryFn) => (
      <div className="w-80">
        <StoryFn />
      </div>
    ),
  ],
}
