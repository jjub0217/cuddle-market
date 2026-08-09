import RequiredLabel from '@/components/commons/RequiredLabel'
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form'

interface BirthDateFieldProps<T extends FieldValues> {
  control: Control<T>
}

/**
 * 년·월·일 세 칸의 클래스.
 *
 * 이 칸들은 공용 Input 을 안 쓴다 — 한 줄에 셋이 나란히 서고 값이 넘어갈 때 옆 칸으로
 * 이어지는 등 다루는 것이 달라서다. 그래서 **생김새는 손으로 맞춰야 한다.**
 * 바로 위 이름·닉네임 칸과 같은 값이어야 한 화면에서 안 튄다:
 *   높이 h-10(40) · 테두리 border-outline(#D1D5DB) · 포커스 primary-500
 *   글자 14 (Input 의 기본값과 같은 값이다) (#847)
 *
 * ⚠️ 전에는 border-gray-400 에 py-2 md:py-3 이라 38이었다. 옆 칸(40)과 2px 이 어긋났고,
 *    공용 Input 의 색을 바꾸자 색까지 혼자 남았다.
 */
const BIRTH_INPUT_CLASS =
  'focus:border-primary-500 border-outline h-10 w-full rounded-lg border bg-white px-3 text-sm placeholder:text-gray-400 focus:outline-none'

const validateBirthDate = (value: string): string | true => {
  const [yearStr, monthStr, dayStr] = value.split('-')

  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  const currentYear = new Date().getFullYear()
  const lastDayOfMonth = new Date(year, month, 0).getDate()

  const birthDate = new Date(year, month - 1, day)
  const today = new Date()

  const age = today.getFullYear() - birthDate.getFullYear()
  const isBeforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  const actualAge = isBeforeBirthday ? age - 1 : age

  if (!value || value === '--') return '생년월일을 입력해주세요'
  if (!yearStr || !monthStr || !dayStr) return '생년월일을 모두 입력해주세요'
  if (isNaN(year) || isNaN(month) || isNaN(day)) return '올바른 날짜 형식을 입력해주세요'
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
    <div className="flex flex-col">
      <RequiredLabel htmlFor="signup-birthdate" labelClass="text-sm">
        생년월일
      </RequiredLabel>
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
            field.onBlur()
          }

          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-4" role="group" aria-label="생년월일">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY"
                  aria-label="생년월일 년도"
                  value={year}
                  onChange={(e) => {
                    const newValue = isNumber(e, 4)
                    updateDate(newValue, month, day)
                  }}
                  onBlur={handleBlur}
                  className={BIRTH_INPUT_CLASS}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM"
                  aria-label="생년월일 월"
                  value={month}
                  onChange={(e) => {
                    const newValue = isNumber(e, 2)
                    updateDate(year, newValue, day)
                  }}
                  onBlur={handleBlur}
                  className={BIRTH_INPUT_CLASS}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="DD"
                  aria-label="생년월일 일"
                  value={day}
                  onChange={(e) => {
                    const newValue = isNumber(e, 2)
                    updateDate(year, month, newValue)
                  }}
                  onBlur={handleBlur}
                  className={BIRTH_INPUT_CLASS}
                />
              </div>
              {fieldState.error ? <p className="text-danger-500 text-xs font-semibold">{fieldState.error.message}</p> : null}
            </div>
          )
        }}
      />
    </div>
  )
}
