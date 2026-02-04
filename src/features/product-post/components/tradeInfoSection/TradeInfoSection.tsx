import { AddressField } from '@/components/commons/AddressField'
import type { ProductPostFormValues } from '../ProductPostForm'
import type { Control, UseFormSetValue } from 'react-hook-form'
import FormSectionHeader from '../FormSectionHeader'

interface TradeInfoSectionProps {
  control: Control<ProductPostFormValues>
  setValue: UseFormSetValue<ProductPostFormValues>
}

export default function TradeInfoSection({ control, setValue }: TradeInfoSectionProps) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-gray-100 bg-white px-6 py-5">
      <FormSectionHeader heading="거래 정보" />
      <AddressField<ProductPostFormValues>
        control={control}
        setValue={setValue}
        primaryName="addressSido"
        secondaryName="addressGugun"
        label="거래 희망 지역"
        labelClass="heading-h5"
        layoutClass="gap-1"
      />
    </div>
  )
}
