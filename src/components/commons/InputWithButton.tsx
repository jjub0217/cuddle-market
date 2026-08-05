'use client'

import InputField from './InputField'
import Button from './button/Button'
import { cn } from '@/lib/utils/cn'
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
  /** 칸 상자의 클래스. 높이를 못 박을 때 쓴다 */
  wrapperClassName?: string
  autoFocus?: boolean
}

export default function InputWithButton({
  id,
  type,
  placeholder,
  error,
  checkResult,
  registration,
  buttonText,
  buttonClassName,
  buttonDisabled,
  onButtonClick,
  size = 'text-sm',
  buttonSize = 'md',
  borderColor = 'border-gray-400',
  inputClass,
  wrapperClassName,
  autoFocus,
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
        inputClass={cn('py-2 md:py-2.5', inputClass)}
        wrapperClassName={wrapperClassName}
        registration={registration}
        autoFocus={autoFocus}
      />
      <Button
        size={buttonSize}
        className={cn(
          'bg-primary-100 text-primary hover:bg-primary-200 cursor-pointer font-semibold shrink-0 h-10 md:h-11 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100 disabled:pointer-events-none',
          buttonClassName,
        )}
        type="button"
        onClick={onButtonClick}
        disabled={buttonDisabled}
      >
        {buttonText}
      </Button>
    </div>
  )
}
