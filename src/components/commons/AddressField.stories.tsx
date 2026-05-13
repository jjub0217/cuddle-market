import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useForm } from 'react-hook-form'
import AddressField from './AddressField'

interface FormValues {
  sido: string
  gugun: string
}

interface WrapperProps {
  label?: string
  required?: boolean
}

function AddressFieldWrapper({ label = '거주지', required = true }: WrapperProps) {
  const { control, setValue } = useForm<FormValues>()
  return (
    <div className="w-[480px]">
      <AddressField<FormValues>
        control={control}
        setValue={setValue}
        primaryName="sido"
        secondaryName="gugun"
        label={label}
        required={required}
      />
    </div>
  )
}

const meta = {
  title: 'Commons/AddressField',
  component: AddressFieldWrapper,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof AddressFieldWrapper>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: '거주지', required: true },
}

export const Optional: Story = {
  args: { label: '거주지 (선택)', required: false },
}
