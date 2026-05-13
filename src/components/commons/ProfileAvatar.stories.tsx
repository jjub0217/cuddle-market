import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import ProfileAvatar from './ProfileAvatar'

const meta = {
  title: 'Commons/ProfileAvatar',
  component: ProfileAvatar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof ProfileAvatar>

export default meta

type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: {
    nickname: '행복한집사',
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    nickname: '행복한집사',
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    nickname: '행복한집사',
    size: 'lg',
  },
}

export const FallbackInitial: Story = {
  args: {
    nickname: 'A',
    size: 'md',
  },
}

export const SizeComparison: Story = {
  args: { nickname: '행복한집사' },
  render: () => (
    <div className="flex items-center gap-4">
      <ProfileAvatar nickname="행복한집사" size="sm" />
      <ProfileAvatar nickname="행복한집사" size="md" />
      <ProfileAvatar nickname="행복한집사" size="lg" />
    </div>
  ),
}
