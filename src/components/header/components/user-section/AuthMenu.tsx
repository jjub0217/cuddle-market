'use client'

import React from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { Menu } from 'lucide-react'
import IconButton from '@/components/commons/button/IconButton'

interface AuthMenuProps {
  isSideOpen: boolean
  setIsSideOpen: React.Dispatch<React.SetStateAction<boolean>>
  hideMenuButton?: boolean
}

export default function AuthMenu({ setIsSideOpen, hideMenuButton = false }: AuthMenuProps) {
  // ⚠️ **폭으로 갈라 그리지 않는다**(#614). 예전에는 `useMediaQuery` 로 재서 한쪽만 그렸는데,
  //    서버는 폭을 모르니 늘 햄버거를 보냈고 **데스크탑 첫 그림에 햄버거가 잠깐 보였다.**
  //    둘 다 그려 두고 CSS 로 가린다 — 기준은 lg(1024), 헤더의 다른 조각과 같은 값이다(#961).
  return (
    <>
      <div className="hidden items-center lg:flex">
        <Link href={ROUTES.LOGIN} className="text-sm font-bold text-primary/70 transition-colors hover:text-primary">
          로그인 / 회원가입
        </Link>
      </div>
      {hideMenuButton ? null : (
        <IconButton aria-label="메뉴" className="lg:hidden" onClick={() => setIsSideOpen((prev) => !prev)}>
          <Menu className="text-header-icon" />
        </IconButton>
      )}
    </>
  )
}
