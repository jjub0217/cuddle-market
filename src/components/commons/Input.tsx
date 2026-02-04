import { cn } from '@/lib/utils/cn'
import { X, type LucideIcon } from 'lucide-react'

interface InputProps {
  type: string
  placeholder?: string
  icon?: LucideIcon
  border?: boolean
  borderColor?: string
  backgroundColor?: string
  value?: string | number
  size?: string
  id?: string
  inputClass?: string
  suffix?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  [key: string]: any // register에서 전달하는 다른 props들을 받기 위해
}

export function Input({
  type,
  placeholder,
  icon: Icon,
  border = false,
  borderColor = 'border-gray-100',
  backgroundColor = 'bg-white',
  value,
  size = 'text-base',
  onChange,
  id,
  inputClass,
  suffix,
  onClear,
  ...rest // 나머지 모든 props (register가 전달하는 ref, name 등)
}: InputProps) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center overflow-hidden rounded-lg transition-colors',
        border && 'focus-within:border-primary-500 border',
        border && borderColor,
        backgroundColor,
        Icon && 'pl-9'
      )}
    >
      {Icon && (
        <div className="absolute left-0 flex h-full w-9 items-center justify-center">
          <Icon className="h-4 w-4 text-gray-400" strokeWidth={2} />
        </div>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          'w-full py-2 placeholder:text-gray-400 focus:border-transparent focus:outline-none md:py-3',
          backgroundColor,
          Icon ? 'pl-0' : 'px-3',
          size,
          inputClass
        )}
        {...rest}
      />
      {suffix && <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">{suffix}</span>}
      {value && onClear && (
        <button onClick={onClear} type="button" className="mr-2 cursor-pointer rounded-full bg-gray-300 p-0.5">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
