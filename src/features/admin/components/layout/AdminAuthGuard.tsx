'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    useUserStore.persist.rehydrate()
  }, [])

  const hasHydrated = useUserStore((state) => state._hasHydrated)
  const userRole = useUserStore((state) => state.user?.userRole)

  // 통과 여부는 store 값에서 그대로 나온다. 따로 state에 복사해 두면
  // 렌더 → effect → setState → 재렌더로 한 박자 늦게 따라오게 된다.
  //
  // 데모 모드에서도 userRole을 함께 보는 이유:
  // 아래 effect가 가짜 관리자를 store에 넣기 전에 통과시켜 버리면, children이
  // 사용자 정보가 없는 상태로 한 번 렌더된다. 예전 코드의 순서(가짜 관리자 세팅 →
  // 그다음 통과)를 그대로 지키려고 userRole이 채워진 뒤에 통과시킨다.
  const isAuthorized = userRole === 'ADMIN' && (DEMO_MODE || hasHydrated)

  useEffect(() => {
    // 데모 모드: 가짜 어드민을 세팅하고 인증 통과 (로그인 불필요)
    if (DEMO_MODE) {
      if (useUserStore.getState().user?.userRole !== 'ADMIN') {
        useUserStore.getState().setUser(DEMO_ADMIN)
      }
      return
    }
    if (!hasHydrated) return

    if (userRole !== 'ADMIN') {
      router.replace(ROUTES.ADMIN_LOGIN)
    }
  }, [hasHydrated, userRole, router])

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
