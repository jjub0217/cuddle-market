import RequiredLabel from '@/components/commons/RequiredLabel'
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
      <RequiredLabel htmlFor="product-description" labelClass="text-sm md:text-base font-semibold">
        {label}
      </RequiredLabel>
      <textarea
        id="product-description"
        placeholder={placeholder}
        className={cn(
          // 테두리는 입력칸(Input)과 같은 border-outline(#D1D5DB)이다.
          // 전에는 border-outline-variant(베이지 #D4C4B2)였다 — 토큰 파일이 「입력칸 경계로
          // 쓰지 말 것」이라 적어 둔 값인데, borderColor 속성이 아니라 클래스로 직접 준 곳이라
          // #847 이 색을 모을 때 빠졌다.
          'focus-ring-custom border-outline bg-surface-container-low focus:ring-primary min-h-[14vh] w-full resize-none rounded-lg border px-4 py-3 text-sm placeholder:text-gray-400 focus:ring-2 focus:outline-none'
        )}
        {...register('description', productPostValidationRules.description)}
      />
      {errors.description ? <p className="text-xs font-semibold text-red-500">{errors.description.message}</p> : null}
    </div>
  )
}
