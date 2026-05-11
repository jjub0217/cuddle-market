'use client'

import React from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Menu } from 'lucide-react'
import IconButton from '@/components/commons/button/IconButton'

interface AuthMenuProps {
  isSideOpen: boolean
  setIsSideOpen: React.Dispatch<React.SetStateAction<boolean>>
  hideMenuButton?: boolean
}

export default function AuthMenu({ setIsSideOpen, hideMenuButton = false }: AuthMenuProps) {
  const isXl = useMediaQuery('(min-width: 1280px)')
  return isXl ? (
    <div className="flex items-center">
      <Link href={ROUTES.LOGIN} className="text-sm font-bold text-primary/70 transition-colors hover:text-primary">
        로그인 / 회원가입
      </Link>
    </div>
  ) : hideMenuButton ? null : (
    <IconButton aria-label="메뉴" onClick={() => setIsSideOpen((prev) => !prev)}>
      <Menu className="text-primary" />
    </IconButton>
  )
}
