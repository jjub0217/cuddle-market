import { RequiredLabel } from '@/components/commons/RequiredLabel'
import 'react-datepicker/dist/react-datepicker.css'
import './BirthDateField.css'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'

interface BirthDateFieldProps<T extends FieldValues> {
  control: Control<T>
}

const validateBirthDate = (value: string): string | true => {
  const [yearStr, monthStr, dayStr] = value.split('-')

  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  const currentYear = new Date().getFullYear()
  const lastDayOfMonth = new Date(year, month, 0).getDate()

  // 미래 날짜 체크
  const birthDate = new Date(year, month - 1, day)
  const today = new Date()

  // 나이 계산 (만 14세 이상)
  const age = today.getFullYear() - birthDate.getFullYear()
  const isBeforeBirthday =
    today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  const actualAge = isBeforeBirthday ? age - 1 : age

  if (!value || value === '--') return '생년월일을 입력해주세요'
  if (!yearStr || !monthStr || !dayStr) return '생년월일을 모두 입력해주세요'
  if (year < 1900 || year > currentYear) return '유효한 년도를 입력해주세요'
  if (month < 1 || month > 12) return '유효한 월을 입력해주세요'
  if (day < 1 || day > lastDayOfMonth) return '유효한 일을 입력해주세요'
  if (birthDate > today) return '미래 날짜는 선택할 수 없습니다'

  return actualAge >= 14 || '만 14세 이상만 가입 가능합니다'
}

export function BirthDateField<T extends FieldValues>({ control }: BirthDateFieldProps<T>) {
  const isNumber = (e: React.ChangeEvent<HTMLInputElement>, maxLength: number) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    return value.slice(0, maxLength)
  }

  return (
    <div className="flex flex-col gap-2.5">
      <RequiredLabel htmlFor="signup-birthdate">생년월일</RequiredLabel>
      <Controller
        name={'birthDate' as Path<T>}
        control={control}
        rules={{
          required: '생년월일을 입력해주세요',
          validate: validateBirthDate,
        }}
        render={({ field, fieldState }) => {
          const [year, month, day] = (field.value || '--').split('-')
          const updateDate = (newYear: string, newMonth: string, newDay: string) => {
            field.onChange(`${newYear}-${newMonth}-${newDay}`)
          }
          const handleBlur = () => {
            const paddedMonth = month ? month.padStart(2, '0') : ''
            const paddedDay = day ? day.padStart(2, '0') : ''
            field.onChange(`${year}-${paddedMonth}-${paddedDay}`)
            field.onBlur() // 유효성 검사 트리거
          }

          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY"
                  value={year}
                  onChange={(e) => {
                    const newValue = isNumber(e, 4)
                    updateDate(newValue, month, day)
                  }}
                  onBlur={handleBlur}
                  className="focus:border-primary-500 w-full rounded-lg border border-gray-400 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none md:py-3"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  value={month}
                  onChange={(e) => {
                    const newValue = isNumber(e, 2)
                    updateDate(year, newValue, day)
                  }}
                  onBlur={handleBlur}
                  className="focus:border-primary-500 w-full rounded-lg border border-gray-400 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none md:py-3"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="DD"
                  value={day}
                  onChange={(e) => {
                    const newValue = isNumber(e, 2)
                    updateDate(year, month, newValue)
                  }}
                  onBlur={handleBlur}
                  className="focus:border-primary-500 w-full rounded-lg border border-gray-400 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none md:py-3"
                />
              </div>
              {fieldState.error && <p className="text-danger-500 text-xs font-semibold">{fieldState.error.message}</p>}
            </div>
          )
        }}
      />
    </div>
  )
}
