import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useForm } from 'react-hook-form'
import CascadingSelectField, { type SelectOption } from './CascadingSelectField'

interface FormValues {
  primary: string
  secondary: string
}

const PET_TYPE_OPTIONS: SelectOption[] = [
  { value: '포유류', label: '포유류' },
  { value: '조류', label: '조류' },
  { value: '파충류', label: '파충류' },
  { value: '수생동물', label: '수생동물' },
]

const PET_DETAIL_MAP: Record<string, SelectOption[]> = {
  포유류: [
    { value: '강아지', label: '강아지' },
    { value: '고양이', label: '고양이' },
    { value: '토끼', label: '토끼' },
    { value: '햄스터', label: '햄스터' },
  ],
  조류: [
    { value: '잉꼬', label: '잉꼬' },
    { value: '앵무새', label: '앵무새' },
    { value: '카나리아', label: '카나리아' },
  ],
  파충류: [
    { value: '도마뱀', label: '도마뱀' },
    { value: '거북이', label: '거북이' },
    { value: '뱀', label: '뱀' },
  ],
  수생동물: [
    { value: '금붕어', label: '금붕어' },
    { value: '열대어', label: '열대어' },
  ],
}

interface WrapperProps {
  label?: string
  required?: boolean
}

function CascadingSelectFieldWrapper({ label = '반려동물 종류', required = true }: WrapperProps) {
  const { control } = useForm<FormValues>()
  return (
    <div className="w-[480px]">
      <CascadingSelectField<FormValues>
        control={control}
        primaryName="primary"
        primaryOptions={PET_TYPE_OPTIONS}
        primaryPlaceholder="펫 종류 선택"
        primaryId="cs-primary"
        secondaryName="secondary"
        secondaryOptionsMap={PET_DETAIL_MAP}
        secondaryPlaceholder="세부 종류 선택"
        secondaryPlaceholderDisabled="먼저 펫 종류를 선택하세요"
        secondaryId="cs-secondary"
        label={label}
        labelHtmlFor="cs-primary"
        required={required}
      />
    </div>
  )
}

const meta = {
  title: 'Commons/CascadingSelectField',
  component: CascadingSelectFieldWrapper,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof CascadingSelectFieldWrapper>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: '반려동물 종류', required: true },
}

export const Optional: Story = {
  args: { label: '반려동물 종류 (선택)', required: false },
}
