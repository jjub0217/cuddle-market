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
    {
      size: 'xs',
      iconPosition: 'only',
      className: 'h-7 w-7 p-0',
    },
    {
      size: 'sm',
      iconPosition: 'only',
      className: 'h-9 w-9 p-0',
    },
    {
      size: 'md',
      iconPosition: 'only',
      className: 'h-11 w-11 p-0',
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
