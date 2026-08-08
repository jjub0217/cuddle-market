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
      // 모바일이 크고 데스크탑에서 작아진다 — 손가락은 44~48 이 필요하고
      // (Apple HIG 44pt · Material 48dp) 마우스 커서는 정확해서 작아도 된다.
      // ⚠️ Tailwind 는 모바일 우선이라 접두사 없는 값이 모바일이고 md: 가 데스크탑이다.
      sm: 'h-10 px-3 text-sm md:h-9',
      md: 'h-12 px-4 text-base md:h-10',
      lg: 'h-14 px-6 text-base md:h-12',
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
      className: 'h-10 w-10 p-0 md:h-9 md:w-9',
    },
    {
      size: 'md',
      iconPosition: 'only',
      className: 'h-12 w-12 p-0 md:h-10 md:w-10',
    },
    {
      size: 'lg',
      iconPosition: 'only',
      className: 'h-14 w-14 p-0 md:h-12 md:w-12',
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
