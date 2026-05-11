import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import type { ProductPostFormValues } from '../ProductPostForm'
import { PriceField } from './components/PriceField'
import { ProductDescriptionFiled } from '../basicInfoSection/components/ProductDescriptionFiled'

interface PriceAndStatusSectionProps {
  register: UseFormRegister<ProductPostFormValues>
  errors: FieldErrors<ProductPostFormValues>
  heading?: string
  priceLabel?: string
  productDescriptionLabel?: string
  productDescriptionPlaceHolder?: string
}

export default function PriceAndStatusSection({
  register,
  errors,
  priceLabel,
  productDescriptionLabel,
  productDescriptionPlaceHolder,
}: PriceAndStatusSectionProps) {
  return (
    <section className="border-outline-variant/30 flex flex-col gap-3 rounded-xl border p-6 shadow-sm">
      <div className="flex flex-col gap-3.5">
        <PriceField register={register} errors={errors} label={priceLabel} suffix="원" />
        <ProductDescriptionFiled
          register={register}
          errors={errors}
          label={productDescriptionLabel}
          placeholder={productDescriptionPlaceHolder}
        />
      </div>
    </section>
  )
}
