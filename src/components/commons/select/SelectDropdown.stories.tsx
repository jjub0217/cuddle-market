import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import SelectDropdown from './SelectDropdown'

const meta = {
  title: 'Commons/SelectDropdown',
  component: SelectDropdown,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof SelectDropdown>

export default meta

type Story = StoryObj<typeof meta>

const PET_OPTIONS = [
  { value: 'dog', label: '강아지' },
  { value: 'cat', label: '고양이' },
  { value: 'rabbit', label: '토끼' },
  { value: 'hamster', label: '햄스터' },
  { value: 'parrot', label: '앵무새' },
]

export const Basic: Story = {
  args: {
    value: 'dog',
    onChange: () => {},
    options: PET_OPTIONS,
    placeholder: '반려동물을 선택하세요',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div className="w-60">
        <SelectDropdown {...args} value={value} onChange={setValue} />
      </div>
    )
  },
}

export const WithPlaceholder: Story = {
  args: {
    value: '',
    onChange: () => {},
    options: PET_OPTIONS,
    placeholder: '선택하세요',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div className="w-60">
        <SelectDropdown {...args} value={value} onChange={setValue} />
      </div>
    )
  },
}

export const Disabled: Story = {
  args: {
    value: 'dog',
    onChange: () => {},
    options: PET_OPTIONS,
    disabled: true,
  },
  render: (args) => (
    <div className="w-60">
      <SelectDropdown {...args} />
    </div>
  ),
}

export const CustomButtonStyle: Story = {
  args: {
    value: 'dog',
    onChange: () => {},
    options: PET_OPTIONS,
    buttonClassName: 'border-0 bg-primary-50 text-gray-900',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return (
      <div className="w-60">
        <SelectDropdown {...args} value={value} onChange={setValue} />
      </div>
    )
  },
}
