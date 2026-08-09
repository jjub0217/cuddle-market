'use client'

import { cn } from '@/lib/utils/cn'
import { X, type LucideIcon } from 'lucide-react'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  icon?: LucideIcon
  border?: boolean
  borderColor?: string
  backgroundColor?: string
  size?: string
  inputClass?: string
  wrapperClassName?: string // outer wrapper className 오버라이드 (rounded, bg, border 등)
  suffix?: string
  onClear?: () => void
}

export default function Input({
  type,
  placeholder,
  icon: Icon,
  border = false,
  // 입력칸 테두리는 여기 하나로 정한다. 전에는 이 기본값(gray-100)이 너무 옅어서
  // 화면마다 gray-400·outline-variant 를 넘겨 덮어썼고, 그래서 색이 갈렸다(#847).
  // 값의 뜻과 대비 판단은 tokens.colors.css 의 --color-outline 에 적었다.
  borderColor = 'border-outline',
  backgroundColor = 'bg-white',
  value,
  // 입력칸 글자. 폭에 상관없이 14 다. 앱(15)에 가장 가까운 값이다
  // (mobile/components/signup/field.tsx — 웹에는 15 가 없다).
  //
  // 화면마다 size="text-sm" 을 넘겨 이 기본값(text-base 16)을 덮고 있었다 — 열네 곳이
  // 모두 같은 값이었다. 같은 값을 열네 번 적어 두면 언젠가 갈리므로 여기로 올린다(#847).
  //
  // ⚠️ 로그인 화면만 데스크탑에서 12 다. 그 까닭은 LoginForm.tsx 에 적었다.
  size = 'text-sm',
  onChange,
  id,
  inputClass,
  wrapperClassName,
  suffix,
  onClear,
  ...rest
}: InputProps) {
  return (
    <div
      className={cn(
        // 높이는 이 상자가 정한다. 폭과 상관없이 40 이다 — 모바일에서 48 로 키워 봤더니
        // 「너무 크다」고 판단했다(#847 실기기 확인).
        //
        // 전에는 h-full(부모를 따라감) + <input> 의 py-* 로 정해져서, 글자 크기를
        // 바꾸면 높이가 따라 흔들렸다.
        'relative flex h-10 w-full items-center overflow-hidden rounded-lg transition-colors',
        border && 'focus-within:border-primary-500 border',
        border && borderColor,
        backgroundColor,
        Icon && 'pl-9',
        wrapperClassName,
      )}
    >
      {Icon ? (
        <div className="absolute left-0 flex h-full w-9 items-center justify-center">
          <Icon className="h-4 w-4 text-gray-400" strokeWidth={2} />
        </div>
      ) : null}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          // 높이는 바깥 상자가 정한다. 여기서 py-* 를 주면 두 곳이 높이를 다툰다.
          'h-full w-full placeholder:text-gray-400 focus:border-transparent focus:outline-none',
          backgroundColor,
          Icon ? 'pl-0' : 'px-3',
          size,
          inputClass,
        )}
        {...rest}
      />
      {suffix ? <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">{suffix}</span> : null}
      {value && onClear ? (
        <button onClick={onClear} type="button" aria-label="입력 내용 지우기" className="mr-2 cursor-pointer rounded-full bg-gray-300 p-0.5">
          <X size={14} />
        </button>
      ) : null}
    </div>
  )
}
