'use client'

import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'
import { SelectDropdown } from './SelectDropdown'
import { RequiredLabel } from '../RequiredLabel'
import { cn } from '@/lib/utils/cn'

export interface SelectOption {
  value: string
  label: string
}

interface CascadingSelectFieldProps<T extends FieldValues> {
  control: Control<T>
  primaryName: Path<T>
  primaryOptions: SelectOption[]
  primaryPlaceholder: string
  primaryId: string
  primaryRule?: string
  secondaryName: Path<T>
  secondaryOptionsMap: Record<string, SelectOption[]>
  secondaryPlaceholder: string
  secondaryPlaceholderDisabled: string
  secondaryId: string
  secondaryRule?: string
  labelClass?: string
  layoutClass?: string
  buttonClassName?: string
  optionClassName?: string
  label: string
  labelHtmlFor: string
  onPrimaryChange?: (value: string) => void
  required?: boolean
}

export function CascadingSelectField<T extends FieldValues>({
  control,
  primaryName,
  primaryOptions,
  primaryPlaceholder,
  primaryId,
  primaryRule = '선택해주세요',
  secondaryName,
  secondaryOptionsMap,
  secondaryPlaceholder,
  secondaryPlaceholderDisabled,
  secondaryId,
  secondaryRule = '선택해주세요',
  labelClass = '',
  layoutClass = '',
  buttonClassName = '',
  optionClassName = '',
  label,
  labelHtmlFor,
  onPrimaryChange,
  required,
}: CascadingSelectFieldProps<T>) {
  return (
    <div className={cn('flex flex-col gap-2.5', layoutClass)}>
      <RequiredLabel htmlFor={labelHtmlFor} labelClass={labelClass} required={required}>
        {label}
      </RequiredLabel>

      <div className="flex flex-col gap-2.5 md:flex-row">
        <Controller
          name={primaryName}
          control={control}
          rules={{ required: primaryRule }}
          render={({ field, fieldState }) => {
            const selectedPrimary = field.value as string
            const secondaryOptions = selectedPrimary ? secondaryOptionsMap[selectedPrimary] || [] : []

            return (
              <>
                <div className="flex flex-1 flex-col gap-1">
                  <SelectDropdown
                    {...field}
                    onChange={(value) => {
                      field.onChange(value)
                      onPrimaryChange?.(value)
                    }}
                    options={primaryOptions}
                    placeholder={primaryPlaceholder}
                    id={primaryId}
                    buttonClassName={buttonClassName}
                    optionClassName={optionClassName}
                  />
                  {fieldState.error && <p className="text-xs font-semibold text-red-500">{fieldState.error.message}</p>}
                </div>

                <Controller
                  name={secondaryName}
                  control={control}
                  rules={{ required: secondaryRule }}
                  render={({ field: secondaryField, fieldState: secondaryFieldState }) => (
                    <div className="flex flex-1 flex-col gap-1">
                      <SelectDropdown
                        {...secondaryField}
                        options={secondaryOptions}
                        placeholder={selectedPrimary ? secondaryPlaceholder : secondaryPlaceholderDisabled}
                        disabled={!selectedPrimary}
                        id={secondaryId}
                        buttonClassName={buttonClassName}
                        optionClassName={optionClassName}
                      />
                      {secondaryFieldState.error && <p className="text-xs font-semibold text-red-500">{secondaryFieldState.error.message}</p>}
                    </div>
                  )}
                />
              </>
            )
          }}
        />
      </div>
    </div>
  )
}
