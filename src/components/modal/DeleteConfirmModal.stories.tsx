import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import DeleteConfirmModal from './DeleteConfirmModal'

const meta = {
  title: 'Commons/Modal/DeleteConfirmModal',
  component: DeleteConfirmModal,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof DeleteConfirmModal>

export default meta

type Story = StoryObj<typeof meta>

const sampleProduct = {
  id: 1,
  title: '폭신폭신 프리미엄 원목 강아지 침대',
  price: 45000,
  mainImageUrl: '/images/category/house.webp',
}

export const Open: Story = {
  args: {
    isOpen: true,
    product: sampleProduct,
    onConfirm: () => {},
    onCancel: () => {},
  },
}

export const WithError: Story = {
  args: {
    isOpen: true,
    product: sampleProduct,
    onConfirm: () => {},
    onCancel: () => {},
    error: (
      <div className="flex flex-col gap-0.5">
        <p className="text-base font-semibold">상품 삭제에 실패했습니다.</p>
        <p>잠시 후 다시 시도해주세요.</p>
      </div>
    ),
    onClearError: () => {},
  },
}
