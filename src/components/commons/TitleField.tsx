'use client'

import InputField from '@/components/commons/InputField'
import RequiredLabel from '@/components/commons/RequiredLabel'
import { type UseFormRegister, type FieldErrors, type RegisterOptions, type FieldValues, type Path, type FieldError } from 'react-hook-form'
import { cn } from '@/lib/utils/cn'

interface TitleFieldProps<T extends FieldValues> {
  register: UseFormRegister<T>
  errors: FieldErrors<T>
  fieldName: Path<T>
  rules?: RegisterOptions<T>
  label?: string
  titleLength?: number
  maxLength?: number
  id?: string
  placeholder?: string
  size?: string
  counterClassName?: string
  labelClassName?: string
}

export default function TitleField<T extends FieldValues>({
  register,
  errors,
  fieldName,
  rules,
  label = '제목',
  titleLength = 0,
  maxLength = 50,
  id = 'title-field',
  placeholder = '제목을 입력해주세요',
  size,
  counterClassName,
  labelClassName = 'heading-h5',
}: TitleFieldProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <RequiredLabel htmlFor={id} labelClass={labelClassName}>
        {label}
      </RequiredLabel>
      <InputField
        id={id}
        type="text"
        placeholder={placeholder}
        size={size}
        border
        backgroundColor="bg-surface-container-low"
        className="flex flex-col gap-2.5"
        error={errors[fieldName] as FieldError | undefined}
        maxLength={maxLength}
        registration={register(fieldName, rules)}
      />
      <p className={cn(counterClassName)}>
        {titleLength}/{maxLength}자
      </p>
    </div>
  )
}
