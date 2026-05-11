import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import LoadMoreButton from './LoadMoreButton'

const meta = {
  title: 'Commons/LoadMoreButton',
  component: LoadMoreButton,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadMoreButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { onClick: () => {} },
}

export const Loading: Story = {
  args: { onClick: () => {}, isLoading: true },
}

export const CustomText: Story = {
  args: { onClick: () => {}, text: '상품 더 보기', loadingText: '불러오는 중...' },
}

export const Disabled: Story = {
  args: { onClick: () => {}, disabled: true },
}
