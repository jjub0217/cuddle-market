import InputField from '@/components/commons/InputField'
import RequiredLabel from '@/components/commons/RequiredLabel'
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
      <RequiredLabel htmlFor="price" labelClass="text-sm md:text-base font-semibold">
        {label}
      </RequiredLabel>
      <div className="relative">
        <InputField
          id="price"
          type="number"
          size="text-sm"
          border
          borderColor="border-outline-variant"
          backgroundColor="bg-surface-container-low"
          className="flex flex-col gap-2.5"
          inputClass="pr-10"
          error={errors.price}
          registration={register('price', productPostValidationRules.price)}
          suffix={suffix}
        />
      </div>
    </div>
  )
}
