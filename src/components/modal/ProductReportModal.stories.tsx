import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ProductReportModal from './ProductReportModal'

const meta = {
  title: 'Commons/Modal/ProductReportModal',
  component: ProductReportModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProductReportModal>

export default meta

type Story = StoryObj<typeof meta>

export const Open: Story = {
  args: {
    isOpen: true,
    productId: 1,
    productTitle: '폭신폭신 프리미엄 원목 강아지 침대',
    onCancel: () => {},
  },
}
