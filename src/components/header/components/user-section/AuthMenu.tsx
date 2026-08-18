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
  // 「여기부터 데스크탑」 — Header.tsx 와 **같은 값**이어야 한다(#961).
  // 여기만 1280 으로 남으면 1024~1280 에서 데스크탑 헤더인데 로그인 자리에만
  // 햄버거 단추가 남는다.
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return isDesktop ? (
    <div className="flex items-center">
      <Link href={ROUTES.LOGIN} className="text-sm font-bold text-primary/70 transition-colors hover:text-primary">
        로그인 / 회원가입
      </Link>
    </div>
  ) : hideMenuButton ? null : (
    <IconButton aria-label="메뉴" onClick={() => setIsSideOpen((prev) => !prev)}>
      <Menu className="text-header-icon" />
    </IconButton>
  )
}
