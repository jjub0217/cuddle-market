import { PetTypeField } from '@/features/product-post/components/basicInfoSection/components/PetTypeField'
import RequiredLabel from '@/components/commons/RequiredLabel'
import SelectDropdown from '@/components/commons/select/SelectDropdown'
import { PRODUCT_CATEGORIES } from '@/constants/constants'
import { ProductStateFilter } from '@/components/product/ProductStateFilter'
import { Controller, type Control, type UseFormSetValue, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import type { ProductPostFormValues } from '../ProductPostForm'
import { ProductNameField } from './components/ProductNameFiled'

interface BasicInfoSectionProps {
  control: Control<ProductPostFormValues>
  setValue: UseFormSetValue<ProductPostFormValues>
  register: UseFormRegister<ProductPostFormValues>
  errors: FieldErrors<ProductPostFormValues>
  productNameLabel?: string
  titleLength?: number
  showProductStatus?: boolean
}

export default function BasicInfoSection({
  control,
  setValue,
  register,
  errors,
  productNameLabel,
  titleLength,
  showProductStatus = true,
}: BasicInfoSectionProps) {
  return (
    <section className="border-outline-variant/30 flex flex-col gap-3 rounded-xl border p-6 shadow-sm">
      {/* <FormSectionHeader heading="기본 정보" /> */}
      <div className="flex flex-col gap-3.5">
        <ProductNameField register={register} errors={errors} label={productNameLabel} titleLength={titleLength} />
        <PetTypeField<ProductPostFormValues>
          control={control}
          setValue={setValue}
          primaryName="petType"
          secondaryName="petDetailType"
        />
        <Controller
          name="category"
          control={control}
          rules={{ required: '카테고리를 선택해주세요' }}
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <RequiredLabel htmlFor="category" labelClass="text-sm md:text-base font-semibold">
                상품 카테고리
              </RequiredLabel>
              <SelectDropdown
                id="category"
                value={field.value || ''}
                onChange={field.onChange}
                options={PRODUCT_CATEGORIES.map((category) => ({
                  value: category.code,
                  label: category.name,
                }))}
                placeholder="카테고리를 선택해주세요"
                buttonClassName="border-outline-variant bg-surface-container-low text-on-surface px-4 py-3"
              />
              {fieldState.error ? <p className="text-xs font-semibold text-red-500">{fieldState.error.message}</p> : null}
            </div>
          )}
        />
        {showProductStatus ? (
          <Controller
            name="productStatus"
            control={control}
            rules={{ required: '상품 상태를 선택해주세요' }}
            render={({ field, fieldState }) => (
              <>
                <ProductStateFilter
                  variant="pill"
                  labelClassname="text-sm md:text-base font-semibold"
                  selectedProductStatus={field.value || null}
                  onProductStatusChange={(status) => field.onChange(status ?? '')}
                />
                {fieldState.error ? <p className="text-xs font-semibold text-red-500">{fieldState.error.message}</p> : null}
              </>
            )}
          />
        ) : null}
      </div>
    </section>
  )
}
