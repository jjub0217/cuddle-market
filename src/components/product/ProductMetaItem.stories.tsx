import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Eye, Heart, MapPin } from 'lucide-react'
import { ProductMetaItem } from './ProductMetaItem'

const meta = {
  title: 'Product/ProductMetaItem',
  component: ProductMetaItem,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProductMetaItem>

export default meta

type Story = StoryObj<typeof meta>

export const WithEyeIcon: Story = {
  args: { icon: Eye, label: '154' },
}

export const Favorites: Story = {
  args: { icon: Heart, label: '찜 12' },
}

export const Location: Story = {
  args: { icon: MapPin, label: '서초동' },
}

export const TextOnly: Story = {
  args: { label: '2시간 전' },
}
