import { type Control, type UseFormSetValue, type FieldValues, type Path } from 'react-hook-form'
import { PETS } from '@/constants/constants'
import { CascadingSelectField, type SelectOption } from '@/components/commons/select/CascadingSelectField'

// 반려동물 대분류 옵션 생성
const petTypeOptions: SelectOption[] = PETS.map((pet) => ({
  value: pet.code,
  label: pet.name,
}))

// 대분류별 소분류 옵션 맵 생성
const petDetailOptionsMap: Record<string, SelectOption[]> = Object.fromEntries(
  PETS.map((pet) => [pet.code, pet.details.map((detail) => ({ value: detail.code, label: detail.name }))])
)

interface PetTypeFieldProps<T extends FieldValues> {
  control: Control<T>
  setValue: UseFormSetValue<T>
  primaryName: Path<T>
  secondaryName: Path<T>
  label?: string
}

export function PetTypeField<T extends FieldValues>({
  control,
  setValue,
  primaryName,
  secondaryName,
  label = '반려동물 종류',
}: PetTypeFieldProps<T>) {
  const handlePrimaryChange = () => {
    // 대분류가 변경되면 소분류 초기화
    setValue(secondaryName, '' as T[typeof secondaryName])
  }

  return (
    <CascadingSelectField
      control={control}
      primaryName={primaryName}
      primaryOptions={petTypeOptions}
      primaryPlaceholder="대분류를 선택해주세요(예: 포유류)"
      primaryId="pet-type"
      primaryRule="대분류를 선택해주세요(예: 포유류)"
      secondaryName={secondaryName}
      secondaryOptionsMap={petDetailOptionsMap}
      secondaryPlaceholder="소분류를 선택해주세요"
      secondaryPlaceholderDisabled="먼저 대분류를 선택해주세요"
      secondaryId="pet-detail"
      secondaryRule="소분류를 선택해주세요"
      label={label}
      labelClass="heading-h5"
      layoutClass="gap-1"
      buttonClassName="px-3 py-3"
      optionClassName=""
      labelHtmlFor="pet-type"
      onPrimaryChange={handlePrimaryChange}
    />
  )
}
