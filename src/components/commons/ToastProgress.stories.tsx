import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ToastProgress from './ToastProgress'

const meta = {
  title: 'Commons/ToastProgress',
  component: ToastProgress,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ToastProgress>

export default meta

type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: {
    trackClass: 'bg-success-200',
    fillClass: 'text-success-600',
    durationMs: 60000,
    onEnd: () => {},
  },
  decorators: [
    (StoryFn) => (
      <div className="border-outline-variant/40 w-80 overflow-hidden rounded-lg border">
        <StoryFn />
      </div>
    ),
  ],
}

export const ErrorTone: Story = {
  args: {
    trackClass: 'bg-danger-200',
    fillClass: 'text-danger-500',
    durationMs: 60000,
    onEnd: () => {},
  },
  decorators: [
    (StoryFn) => (
      <div className="border-outline-variant/40 w-80 overflow-hidden rounded-lg border">
        <StoryFn />
      </div>
    ),
  ],
}

export const WarningTone: Story = {
  args: {
    trackClass: 'bg-[#faf7be]',
    fillClass: 'text-[#d9ac2c]',
    durationMs: 60000,
    onEnd: () => {},
  },
  decorators: [
    (StoryFn) => (
      <div className="border-outline-variant/40 w-80 overflow-hidden rounded-lg border">
        <StoryFn />
      </div>
    ),
  ],
}
