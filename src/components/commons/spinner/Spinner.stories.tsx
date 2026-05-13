import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Spinner from './Spinner'

const meta = {
  title: 'Commons/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Spinner>

export default meta

type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: { size: 'sm' },
}

export const Medium: Story = {
  args: { size: 'md' },
}

export const Large: Story = {
  args: { size: 'lg' },
}

export const CustomLabel: Story = {
  args: { size: 'md', label: '상품을 불러오는 중...' },
}
