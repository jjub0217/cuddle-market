import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import RequiredLabel from './RequiredLabel'

const meta = {
  title: 'Commons/RequiredLabel',
  component: RequiredLabel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof RequiredLabel>

export default meta

type Story = StoryObj<typeof meta>

export const Required: Story = {
  args: { children: '이메일', htmlFor: 'email-input', required: true },
}

export const Optional: Story = {
  args: { children: '닉네임', htmlFor: 'nickname-input', required: false },
}

export const WithCustomClass: Story = {
  args: { children: '제목', htmlFor: 'title-input', labelClass: 'text-lg font-bold text-on-surface' },
}
