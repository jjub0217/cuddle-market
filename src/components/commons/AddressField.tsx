import { type Control, type UseFormSetValue, type FieldValues, type Path } from 'react-hook-form'
import { CITIES, PROVINCES } from '@/constants/cities'
import { CascadingSelectField, type SelectOption } from '@/components/commons/select/CascadingSelectField'

// 시/도 옵션 생성
const provinceOptions: SelectOption[] = PROVINCES.map((province) => ({
  value: province,
  label: province,
}))

// 시/도별 구/군 옵션 맵 생성
const cityOptionsMap: Record<string, SelectOption[]> = Object.fromEntries(
  Object.entries(CITIES).map(([province, cities]) => [province, cities.map((city) => ({ value: city, label: city }))])
)

interface AddressFieldProps<T extends FieldValues> {
  control: Control<T>
  setValue: UseFormSetValue<T>
  primaryName: Path<T>
  secondaryName: Path<T>
  label?: string
  labelClass?: string
  layoutClass?: string
  required?: boolean
}

export function AddressField<T extends FieldValues>({
  control,
  setValue,
  primaryName,
  secondaryName,
  label = '거주지',
  labelClass,
  layoutClass,
  required,
}: AddressFieldProps<T>) {
  const handlePrimaryChange = () => {
    // 시/도가 변경되면 구/군 초기화
    setValue(secondaryName, '' as T[typeof secondaryName])
  }

  return (
    <CascadingSelectField
      control={control}
      primaryName={primaryName}
      primaryOptions={provinceOptions}
      primaryPlaceholder="시/도를 선택해주세요"
      primaryId="address-sido"
      primaryRule="시/도를 선택해주세요"
      secondaryName={secondaryName}
      secondaryOptionsMap={cityOptionsMap}
      secondaryPlaceholder="시/군/구 를 선택해주세요"
      secondaryPlaceholderDisabled="먼저 시/도를 선택해주세요"
      secondaryId="address-gugun"
      secondaryRule="구/군을 선택해주세요"
      label={label}
      labelClass={labelClass}
      layoutClass={layoutClass}
      labelHtmlFor="address-sido"
      onPrimaryChange={handlePrimaryChange}
      required={required}
    />
  )
}
