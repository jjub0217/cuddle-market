import { PetTypeField } from '@/features/product-post/components/basicInfoSection/components/PetTypeField'
import { RequiredLabel } from '@/components/commons/RequiredLabel'
import { SelectDropdown } from '@/components/commons/select/SelectDropdown'
import { PRODUCT_CATEGORIES } from '@/constants/constants'
import { ProductDescriptionFiled } from './components/ProductDescriptionFiled'
import { Controller, type Control, type UseFormSetValue, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import type { ProductPostFormValues } from '../ProductPostForm'
import { ProductNameField } from './components/ProductNameFiled'
import FormSectionHeader from '../FormSectionHeader'

interface BasicInfoSectionProps {
  control: Control<ProductPostFormValues>
  setValue: UseFormSetValue<ProductPostFormValues>
  register: UseFormRegister<ProductPostFormValues>
  errors: FieldErrors<ProductPostFormValues>
  productNameLabel?: string
  productDescriptionLabel?: string
  productDescriptionPlaceHolder?: string
  titleLength?: number
}

export default function BasicInfoSection({
  control,
  setValue,
  register,
  errors,
  productNameLabel,
  productDescriptionLabel,
  productDescriptionPlaceHolder,
  titleLength,
}: BasicInfoSectionProps) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-gray-100 bg-white px-6 py-5">
      <FormSectionHeader heading="기본 정보" description="상품의 기본 정보를 입력해주세요. *는 필수 항목입니다." />
      <PetTypeField<ProductPostFormValues> control={control} setValue={setValue} primaryName="petType" secondaryName="petDetailType" />
      <Controller
        name="category"
        control={control}
        rules={{ required: '카테고리를 선택해주세요' }}
        render={({ field, fieldState }) => (
          <div className="flex flex-col gap-1">
            <RequiredLabel htmlFor="category" labelClass="heading-h5">
              상품 카테고리
            </RequiredLabel>
            <SelectDropdown
              value={field.value || ''}
              onChange={field.onChange}
              options={PRODUCT_CATEGORIES.map((category) => ({
                value: category.code,
                label: category.name,
              }))}
              placeholder="카테고리를 선택해주세요"
              buttonClassName="border-gray-400 bg-white border text-gray-900 px-3 py-3 border"
            />
            {fieldState.error && <p className="text-xs font-semibold text-red-500">{fieldState.error.message}</p>}
          </div>
        )}
      />
      <ProductNameField register={register} errors={errors} label={productNameLabel} titleLength={titleLength} />
      <ProductDescriptionFiled register={register} errors={errors} label={productDescriptionLabel} placeholder={productDescriptionPlaceHolder} />
    </section>
  )
}
