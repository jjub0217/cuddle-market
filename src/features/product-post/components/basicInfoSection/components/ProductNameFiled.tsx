import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { productPostValidationRules } from '@/features/signup/validationRules'
import type { ProductPostFormValues } from '../../ProductPostForm'
import { TitleField } from '@/components/commons/TitleField'

interface ProductNameFieldProps {
  register: UseFormRegister<ProductPostFormValues>
  errors: FieldErrors<ProductPostFormValues>
  label?: string
  titleLength?: number
}

export function ProductNameField({ register, errors, label = '상품명', titleLength = 0 }: ProductNameFieldProps) {
  return (
    <TitleField<ProductPostFormValues>
      register={register}
      errors={errors}
      fieldName="title"
      rules={productPostValidationRules.name}
      label={label}
      titleLength={titleLength}
      maxLength={50}
      id="product-title"
      placeholder="예: 강아지 사료 10kg 상품"
    />
  )
}
