import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useForm } from 'react-hook-form'
import InputWithButton from './InputWithButton'

interface WrapperProps {
  buttonText?: string
  buttonDisabled?: boolean
  variant?: 'default' | 'error' | 'success'
}

function InputWithButtonWrapper({
  buttonText = '중복확인',
  buttonDisabled = false,
  variant = 'default',
}: WrapperProps) {
  const { register } = useForm()
  return (
    <div className="w-96">
      <InputWithButton
        id="nickname"
        type="text"
        placeholder="닉네임을 입력하세요"
        registration={register('nickname')}
        buttonText={buttonText}
        buttonDisabled={buttonDisabled}
        error={variant === 'error' ? ({ type: 'required', message: '닉네임을 입력해주세요' } as never) : undefined}
        checkResult={
          variant === 'success'
            ? { status: 'success', message: '사용 가능한 닉네임입니다' }
            : variant === 'error'
              ? { status: 'error', message: '이미 사용중인 닉네임입니다' }
              : undefined
        }
      />
    </div>
  )
}

const meta = {
  title: 'Commons/InputWithButton',
  component: InputWithButtonWrapper,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'error', 'success'] },
    buttonDisabled: { control: 'boolean' },
  },
} satisfies Meta<typeof InputWithButtonWrapper>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: { variant: 'default' } }
export const WithError: Story = { args: { variant: 'error' } }
export const WithSuccessResult: Story = { args: { variant: 'success' } }
export const ButtonDisabled: Story = { args: { variant: 'default', buttonDisabled: true } }
