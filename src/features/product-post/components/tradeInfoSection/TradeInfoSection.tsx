import AddressField from '@/components/commons/AddressField'
import type { ProductPostFormValues } from '../ProductPostForm'
import type { Control, UseFormSetValue } from 'react-hook-form'

interface TradeInfoSectionProps {
  control: Control<ProductPostFormValues>
  setValue: UseFormSetValue<ProductPostFormValues>
}

export default function TradeInfoSection({ control, setValue }: TradeInfoSectionProps) {
  return (
    <section className="border-outline-variant/30 flex flex-col gap-3 rounded-xl border p-6 shadow-sm">
      <AddressField<ProductPostFormValues>
        control={control}
        setValue={setValue}
        primaryName="addressSido"
        secondaryName="addressGugun"
        label="거래 희망 지역"
        labelClass="text-sm md:text-base font-semibold"
        layoutClass="gap-1"
        buttonClassName="border-outline-variant bg-surface-container-low text-on-surface px-4 py-3"
      />
    </section>
  )
}
