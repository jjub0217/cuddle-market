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
  buttonSize?: 'sm' | 'md' | 'lg'
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
  size,
  buttonSize = 'md',
  borderColor,
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
        inputClass={cn(inputClass)}
        wrapperClassName={wrapperClassName}
        registration={registration}
        autoFocus={autoFocus}
      />
      <Button
        size={buttonSize}
        className={cn(
          // 옆 입력칸과 같은 높이여야 줄이 맞는다. 전에는 h-10 md:h-11 이라
          // 입력칸(42)과 2px 이 어긋났다 — 이슈가 「제일 눈에 띈다」고 적은 자리다(#847).
          'bg-primary-100 text-primary hover:bg-primary-200 cursor-pointer font-semibold shrink-0 h-10 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:bg-gray-100 disabled:pointer-events-none',
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
