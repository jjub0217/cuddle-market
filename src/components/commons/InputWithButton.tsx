'use client'

import { InputField } from './InputField'
import { Button } from './button/Button'
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
  onButtonClick?: () => void
  size?: string
  buttonSize?: 'xs' | 'sm' | 'md' | 'lg'
  borderColor?: string
}

export function InputWithButton({
  id,
  type,
  placeholder,
  error,
  checkResult,
  registration,
  buttonText,
  buttonClassName = 'bg-primary-50 text-primary-500 cursor-pointer font-semibold',
  onButtonClick,
  size = 'text-sm',
  buttonSize = 'md',
  borderColor = 'border-gray-400',
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
        classname="flex-1"
        registration={registration}
      />
      <Button size={buttonSize} className={buttonClassName} type="button" onClick={onButtonClick}>
        {buttonText}
      </Button>
    </div>
  )
}
