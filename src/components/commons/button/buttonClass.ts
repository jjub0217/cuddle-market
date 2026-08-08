import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva('flex items-center justify-center rounded-lg font-medium transition-colors', {
  variants: {
    variant: {
      default: '',
      ghost: 'bg-transparent hover:bg-gray-100',
      link: 'bg-transparent p-0 hover:underline',
      primary:
        'bg-primary shadow-primary/20 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl',
      secondary:
        'border border-outline-variant/60 text-on-surface hover:bg-surface-container-high transition-all',
    },
    size: {
      // 높이를 h-* 로 못 박는다. padding + 줄높이로 정하면 글자 크기를 바꿀 때마다
      // 높이가 따라 흔들려, 나란히 놓인 칸과 단추의 줄이 안 맞는다(#847).
      //
      // 폭에 따라 바꾸지 않는다. 한때 모바일을 48 로 키워 봤는데(손가락 권장치)
      // **입력칸(40)보다 단추가 커서 어색했다** — 실기기로 보고 되돌렸다.
      // md 40 이 입력칸(Input.tsx 의 h-10)과 같은 값이다.
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-6 text-base',
    },
    iconPosition: {
      none: '',
      left: 'gap-2.5',
      only: '',
    },
    disabled: {
      true: 'cursor-not-allowed opacity-50',
    },
  },
  // 아이콘만 있는 단추는 가로세로가 같아야 동그라미·네모가 안 찌그러진다.
  // 위 size 의 높이와 같은 값을 쓴다.
  compoundVariants: [
    {
      size: 'sm',
      iconPosition: 'only',
      className: 'h-9 w-9 p-0',
    },
    {
      size: 'md',
      iconPosition: 'only',
      className: 'h-10 w-10 p-0',
    },
    {
      size: 'lg',
      iconPosition: 'only',
      className: 'h-12 w-12 p-0',
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'md',
    iconPosition: 'none',
  },
})

export const iconSizeMap = {
  xs: 16,
  sm: 16,
  md: 20,
  lg: 24,
} as const

export type ButtonVariants = VariantProps<typeof buttonVariants>
