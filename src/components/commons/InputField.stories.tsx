import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useForm } from 'react-hook-form'
import InputField from './InputField'

interface WrapperProps {
  variant?: 'default' | 'error' | 'success-check' | 'error-check'
}

function InputFieldWrapper({ variant = 'default' }: WrapperProps) {
  const { register } = useForm()
  return (
    <div className="w-80">
      <InputField
        type="email"
        placeholder="email@example.com"
        registration={register('email')}
        border
        error={variant === 'error' ? ({ type: 'required', message: '이메일을 입력해주세요' } as never) : undefined}
        checkResult={
          variant === 'success-check'
            ? { status: 'success', message: '사용 가능한 이메일입니다' }
            : variant === 'error-check'
              ? { status: 'error', message: '이미 사용중인 이메일입니다' }
              : undefined
        }
      />
    </div>
  )
}

const meta = {
  title: 'Commons/InputField',
  component: InputFieldWrapper,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'error', 'success-check', 'error-check'] },
  },
} satisfies Meta<typeof InputFieldWrapper>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { variant: 'default' } }
export const WithError: Story = { args: { variant: 'error' } }
export const WithSuccessCheck: Story = { args: { variant: 'success-check' } }
export const WithErrorCheck: Story = { args: { variant: 'error-check' } }
