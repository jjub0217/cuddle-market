'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { ROUTES } from '@/constants/routes'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

const DEMO_ADMIN = {
  id: 0,
  email: 'demo@cuddle.market',
  name: '데모 관리자',
  nickname: 'demo_admin',
  birthDate: '1990-01-01',
  addressSido: '서울특별시',
  addressGugun: '강남구',
  userRole: 'ADMIN' as const,
}

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    useUserStore.persist.rehydrate()
  }, [])

  const hasHydrated = useUserStore((state) => state._hasHydrated)
  const userRole = useUserStore((state) => state.user?.userRole)

  useEffect(() => {
    // 데모 모드: 가짜 어드민을 세팅하고 인증 통과 (로그인 불필요)
    if (DEMO_MODE) {
      if (useUserStore.getState().user?.userRole !== 'ADMIN') {
        useUserStore.getState().setUser(DEMO_ADMIN)
      }
      setIsAuthorized(true)
      return
    }
    if (!hasHydrated) return

    if (userRole !== 'ADMIN') {
      router.replace(ROUTES.ADMIN_LOGIN)
    } else {
      setIsAuthorized(true)
    }
  }, [hasHydrated, userRole, router])

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
