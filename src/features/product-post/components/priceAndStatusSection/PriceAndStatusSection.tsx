import { Controller, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import type { ProductPostFormValues } from '../ProductPostForm'
import { ProductStateFilter } from '@/components/product/ProductStateFilter'
import { PriceField } from './components/PriceField'
import FormSectionHeader from '../FormSectionHeader'

interface PriceAndStatusSectionProps {
  control: Control<ProductPostFormValues>
  register: UseFormRegister<ProductPostFormValues>
  errors: FieldErrors<ProductPostFormValues>
  showProductStateFilter?: boolean
  heading?: string
  priceLabel?: string
}

export default function PriceAndStatusSection({
  control,
  register,
  errors,
  showProductStateFilter = true,
  heading = '가격 및 상태',
  priceLabel,
}: PriceAndStatusSectionProps) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-gray-100 bg-white px-6 py-5">
      <FormSectionHeader heading={heading} />
      <PriceField register={register} errors={errors} label={priceLabel} suffix="원" />
      {showProductStateFilter && (
        <Controller
          name="productStatus"
          control={control}
          rules={{ required: '상품 상태를 선택해주세요' }}
          render={({ field, fieldState }) => (
            <>
              <ProductStateFilter
                inputClassname="flex-1"
                labelClassname="py-4 font-semibold"
                subTitle
                selectedProductStatus={field.value || null}
                onProductStatusChange={(status) => field.onChange(status ?? '')}
              />
              {fieldState.error && <p className="text-xs font-semibold text-red-500">{fieldState.error.message}</p>}
            </>
          )}
        />
      )}
    </section>
  )
}
