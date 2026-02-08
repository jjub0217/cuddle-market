'use client'

import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { buttonVariants, iconSizeMap, type ButtonVariants } from './buttonClass'
import Image from 'next/image'

interface ButtonProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'disabled'>, ButtonVariants {
  children?: ReactNode
  icon?: LucideIcon
  iconSrc?: string
  disabled?: boolean
  iconProps?: React.ComponentProps<LucideIcon>
}

export function Button({ children, icon: Icon, iconSrc, variant, size = 'md', disabled = false, type = 'button', className, iconProps, ...rest }: ButtonProps) {
  const iconPosition = (Icon || iconSrc) && !children ? 'only' : (Icon || iconSrc) && children ? 'left' : 'none'
  const iconSize = size && Icon ? iconSizeMap[size] : undefined

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(buttonVariants({ variant, size, iconPosition, disabled: disabled || undefined }), className)}
      {...rest}
    >
      {Icon && <Icon size={iconSize} {...iconProps} />}
      {iconSrc && <Image src={iconSrc} alt="" width={16} height={16} className="object-contain" />}
      {children}
    </button>
  )
}
