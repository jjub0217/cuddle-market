import { cva, type VariantProps } from 'class-variance-authority'

export const buttonVariants = cva('flex items-center justify-center rounded-lg font-medium transition-colors', {
  variants: {
    variant: {
      default: '',
      ghost: 'bg-transparent hover:bg-gray-100',
      link: 'bg-transparent p-0 hover:underline',
    },
    size: {
      xs: 'px-3 py-2 text-sm',
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-base',
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
  compoundVariants: [
    // 아이콘만 있을 때 정사각형 크기 적용
    {
      size: 'xs',
      iconPosition: 'only',
      className: 'h-7 w-7 p-0', // 28px
    },
    {
      size: 'sm',
      iconPosition: 'only',
      className: 'h-9 w-9 p-0', // 36px
    },
    {
      size: 'md',
      iconPosition: 'only',
      className: 'h-11 w-11 p-0', // 44px
    },
    {
      size: 'lg',
      iconPosition: 'only',
      className: 'h-12 w-12 p-0', // 48px
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'md',
    iconPosition: 'none',
  },
})

export const iconSizeMap = {
  xs: 16, // 4 * 4 = 16px (w-4 h-4)
  sm: 16, // 4 * 4 = 16px (w-4 h-4)
  md: 20, // 5 * 4 = 20px (w-5 h-5)
  lg: 24, // 6 * 4 = 24px (w-6 h-6)
} as const

export type ButtonVariants = VariantProps<typeof buttonVariants>
