'use client'

import { cn } from '@/lib/utils/cn'
import type { ReactNode, MouseEvent } from 'react'

interface IconButtonProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'onClick'> {
  children: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyles = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
}

export default function IconButton({ children, onClick, size = 'md', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} onClick={onClick} className={cn('cursor-pointer rounded', sizeStyles[size], className)} {...rest}>
      {children}
    </button>
  )
}
