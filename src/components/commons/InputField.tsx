'use client'

import { Input } from '@/components/commons/Input'
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface InputFieldProps {
  type: string
  placeholder?: string
  icon?: LucideIcon
  border?: boolean
  borderColor?: string
  backgroundColor?: string
  size?: string
  error?: FieldError
  checkResult?: { status: string; message: string }
  classname?: string
  inputClass?: string
  registration: UseFormRegisterReturn
  id?: string
  suffix?: string
  autoFocus?: boolean
}

export function InputField({ error, checkResult, registration, classname, inputClass, id, suffix, ...inputProps }: InputFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', classname)}>
      <Input {...inputProps} {...registration} inputClass={inputClass} id={id} suffix={suffix} />
      {error && <p className="text-danger-500 text-xs font-semibold">{error.message}</p>}
      {checkResult?.message && (
        <p className={cn('text-xs font-semibold', checkResult.status === 'error' ? 'text-danger-500' : 'text-success-500')}>
          {checkResult.message}
        </p>
      )}
    </div>
  )
}
