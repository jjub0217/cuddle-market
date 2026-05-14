'use client'

import InputField from './InputField'
import Button from './button/Button'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'

interface InputWithButtonProps {
  id: string
  type: string
  placeholder?: string
  error?: FieldError
  checkResult?: { status: string; message: string }
  registration: UseFormRegisterReturn
  buttonText: string
  buttonClassName?: string
  buttonDisabled?: boolean
  onButtonClick?: () => void
  size?: string
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg'
  borderColor?: string
  inputClass?: string
}

export default function InputWithButton({
  id,
  type,
  placeholder,
  error,
  checkResult,
  registration,
  buttonText,
  buttonClassName = 'bg-primary-100 text-primary cursor-pointer font-semibold',
  buttonDisabled,
  onButtonClick,
  size = 'text-sm',
  buttonSize = 'md',
  borderColor = 'border-gray-400',
  inputClass,
}: InputWithButtonProps) {
  return (
    <div className="flex items-start gap-4">
      <InputField
        id={id}
        type={type}
        placeholder={placeholder}
        size={size}
        border
        borderColor={borderColor}
        error={error}
        checkResult={checkResult}
        className="flex-1"
        inputClass={inputClass}
        registration={registration}
      />
      <Button size={buttonSize} className={buttonClassName} type="button" onClick={onButtonClick} disabled={buttonDisabled}>
        {buttonText}
      </Button>
    </div>
  )
}
