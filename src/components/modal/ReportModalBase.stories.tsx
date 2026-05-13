import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ReportModalBase from './ReportModalBase'
import { POST_REPORT_REASON } from '@/constants/constants'

const meta = {
  title: 'Commons/Modal/ReportModalBase',
  component: ReportModalBase,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof ReportModalBase>

export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    isOpen: true,
    heading: '신고하기',
    description: '신고 사유를 선택해주세요',
    reasons: POST_REPORT_REASON,
    onCancel: () => {},
    onSubmit: async () => {},
  },
}

export const WithError: Story = {
  args: {
    isOpen: true,
    heading: '신고하기',
    description: '신고 사유를 선택해주세요',
    reasons: POST_REPORT_REASON,
    onCancel: () => {},
    onSubmit: async () => {},
    error: (
      <div className="flex flex-col gap-0.5">
        <p className="text-base font-semibold">신고에 실패했습니다.</p>
        <p>잠시 후 다시 시도해주세요.</p>
      </div>
    ),
    onClearError: () => {},
  },
}
