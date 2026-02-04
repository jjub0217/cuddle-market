import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { Menu } from 'lucide-react'
import { IconButton } from '@/components/commons/button/IconButton'

interface AuthMenuProps {
  isSideOpen: boolean
  setIsSideOpen: (isSideOpen: boolean) => void
  hideMenuButton?: boolean
}

export default function AuthMenu({ isSideOpen, setIsSideOpen, hideMenuButton = false }: AuthMenuProps) {
  const isXl = useMediaQuery('(min-width: 1280px)')
  return isXl ? (
    <div className="flex items-center gap-5">
      <Link href={ROUTES.LOGIN} className="rounded-lg bg-white px-2 py-1 text-center text-sm xl:min-w-20 xl:px-3 xl:py-2">
        로그인 / 회원가입
      </Link>
    </div>
  ) : hideMenuButton ? null : (
    <IconButton aria-label="메뉴" onClick={() => setIsSideOpen(!isSideOpen)}>
      <Menu className="text-white" />
    </IconButton>
  )
}
