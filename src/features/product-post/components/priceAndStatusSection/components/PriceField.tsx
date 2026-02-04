import { InputField } from '@/components/commons/InputField'
import { RequiredLabel } from '@/components/commons/RequiredLabel'
// import type { SignUpFormValues } from './SignUpForm'
import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import type { ProductPostFormValues } from '../../ProductPostForm'
import { productPostValidationRules } from '@/features/signup/validationRules'

interface PriceFieldProps {
  register: UseFormRegister<ProductPostFormValues>
  errors: FieldErrors<ProductPostFormValues>
  label?: string
  suffix?: string
}

export function PriceField({ register, errors, suffix, label = '판매 가격' }: PriceFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <RequiredLabel htmlFor="price" labelClass="heading-h5">
        {label}
      </RequiredLabel>
      <div className="relative">
        <InputField
          id="price"
          type="number"
          size="text-sm"
          border
          borderColor="border-gray-400"
          classname="flex flex-col gap-2.5"
          inputClass="pr-10"
          error={errors.price}
          registration={register('price', productPostValidationRules.price)}
          suffix={suffix}
        />
        {/* <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">원</span> */}
      </div>
    </div>
  )
}
