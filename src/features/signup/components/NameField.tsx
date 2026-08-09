import InputField from '@/components/commons/InputField'
import RequiredLabel from '@/components/commons/RequiredLabel'
import type { SignUpFormValues } from './SignUpForm'
import { type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { signupValidationRules } from '../validationRules'

interface NameFieldProps {
  register: UseFormRegister<SignUpFormValues>
  errors: FieldErrors<SignUpFormValues>
}

export function NameField({ register, errors }: NameFieldProps) {
  return (
    <div className="flex flex-col">
      <RequiredLabel htmlFor="signup-name" labelClass="text-sm">
        이름
      </RequiredLabel>
      <InputField
        id="signup-name"
        type="text"
        placeholder="이름을 입력해주세요"
        border
        className="flex flex-col gap-2.5"
        error={errors.name}
        registration={register('name', signupValidationRules.name)}
      />
    </div>
  )
}
