import { RequiredLabel } from '@/components/commons/RequiredLabel'
import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import type { ProductPostFormValues } from '../../ProductPostForm'
import { productPostValidationRules } from '@/features/signup/validationRules'
import { cn } from '@/lib/utils/cn'

interface ProductDescriptionFiledProps {
  register: UseFormRegister<ProductPostFormValues>
  errors: FieldErrors<ProductPostFormValues>
  label?: string
  placeholder?: string
}

export function ProductDescriptionFiled({
  register,
  errors,
  label = '상품 설명',
  placeholder = '상품의 상태, 구매 시기, 사용 빈도, 특징 등을 자세히 적어주세요',
}: ProductDescriptionFiledProps) {
  return (
    <div className="flex flex-col gap-1">
      <RequiredLabel htmlFor="product-description" labelClass="heading-h5">
        {label}
      </RequiredLabel>
      <textarea
        id="product-description"
        placeholder={placeholder}
        className={cn(
          'focus:border-primary-500 min-h-[14vh] w-full resize-none rounded-lg border border-gray-400 bg-white px-3 py-3 text-sm placeholder:text-gray-400 focus:outline-none'
        )}
        {...register('description', productPostValidationRules.description)}
      />
      {errors.description && <p className="text-xs font-semibold text-red-500">{errors.description.message}</p>}
    </div>
  )
}
