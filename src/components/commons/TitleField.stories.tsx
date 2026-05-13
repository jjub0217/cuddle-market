import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useForm } from 'react-hook-form'
import TitleField from './TitleField'

interface FormValues {
  title: string
}

interface WrapperProps {
  label?: string
  placeholder?: string
  maxLength?: number
  titleLength?: number
  withError?: boolean
}

function TitleFieldWrapper({
  label = '제목',
  placeholder = '제목을 입력해주세요',
  maxLength = 50,
  titleLength = 0,
  withError = false,
}: WrapperProps) {
  const form = useForm<FormValues>()
  return (
    <div className="w-96">
      <TitleField<FormValues>
        register={form.register}
        errors={withError ? ({ title: { type: 'required', message: '제목을 입력해주세요' } } as never) : {}}
        fieldName="title"
        label={label}
        placeholder={placeholder}
        maxLength={maxLength}
        titleLength={titleLength}
      />
    </div>
  )
}

const meta = {
  title: 'Commons/TitleField',
  component: TitleFieldWrapper,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof TitleFieldWrapper>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: '제목', placeholder: '제목을 입력해주세요', maxLength: 50, titleLength: 0 },
}

export const WithCounter: Story = {
  args: { label: '제목', maxLength: 50, titleLength: 28 },
}

export const WithError: Story = {
  args: { label: '제목', withError: true },
}

export const CustomLabel: Story = {
  args: { label: '커뮤니티 글 제목', placeholder: '궁금한 점이나 공유할 정보를 적어주세요', maxLength: 100 },
}
