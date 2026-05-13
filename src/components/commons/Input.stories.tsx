import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import { Search, Mail } from 'lucide-react'
import Input from './Input'

const meta = {
  title: 'Commons/Input',
  component: Input,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { placeholder: '입력해주세요', border: true },
  decorators: [
    (StoryFn) => (
      <div className="w-80">
        <StoryFn />
      </div>
    ),
  ],
}

export const WithIcon: Story = {
  args: { placeholder: '검색어를 입력하세요', icon: Search, border: true },
  decorators: [
    (StoryFn) => (
      <div className="w-80">
        <StoryFn />
      </div>
    ),
  ],
}

export const Email: Story = {
  args: { type: 'email', placeholder: 'email@example.com', icon: Mail, border: true },
  decorators: [
    (StoryFn) => (
      <div className="w-80">
        <StoryFn />
      </div>
    ),
  ],
}

export const WithSuffix: Story = {
  args: { type: 'number', placeholder: '수량', suffix: '개', border: true },
  decorators: [
    (StoryFn) => (
      <div className="w-80">
        <StoryFn />
      </div>
    ),
  ],
}

export const Clearable: Story = {
  args: { placeholder: '입력 후 X로 지우기', border: true },
  render: (args) => {
    const [value, setValue] = useState('지울 수 있는 텍스트')
    return (
      <div className="w-80">
        <Input {...args} value={value} onChange={(e) => setValue(e.target.value)} onClear={() => setValue('')} />
      </div>
    )
  },
}
