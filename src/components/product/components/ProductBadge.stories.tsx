import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ProductBadge } from './ProductBadge'

const meta = {
  title: 'Product/ProductBadge',
  component: ProductBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof ProductBadge>

export default meta

type Story = StoryObj<typeof meta>

export const SinglePrimary: Story = {
  args: {
    items: [{ label: '강아지', tone: 'primary' }],
    size: 'sm',
  },
}

export const InfoTone: Story = {
  args: {
    items: [{ label: '판매', tone: 'info' }],
    size: 'sm',
  },
}

export const WarningTone: Story = {
  args: {
    items: [{ label: '판매요청', tone: 'warning' }],
    size: 'sm',
  },
}

export const OutlineTone: Story = {
  args: {
    items: [{ label: '거의 새것', tone: 'outline' }],
    size: 'sm',
  },
}

export const Combined: Story = {
  args: {
    items: [
      { label: '판매', tone: 'info' },
      { label: '거의 새것', tone: 'outline' },
    ],
    size: 'sm',
  },
}

export const MediumSize: Story = {
  args: {
    items: [
      { label: '판매', tone: 'info' },
      { label: '거의 새것', tone: 'outline' },
    ],
    size: 'md',
  },
}

export const AllTones: Story = {
  args: {
    items: [
      { label: 'primary', tone: 'primary' },
      { label: 'light', tone: 'light' },
      { label: 'info', tone: 'info' },
      { label: 'warning', tone: 'warning' },
      { label: 'outline', tone: 'outline' },
    ],
    size: 'sm',
  },
}
