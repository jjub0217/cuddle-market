'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUserStore } from '@/store/userStore'
import { ROUTES } from '@/constants/routes'

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useEffect(() => {
    useUserStore.persist.rehydrate()
  }, [])

  const hasHydrated = useUserStore((state) => state._hasHydrated)
  const userRole = useUserStore((state) => state.user?.userRole)

  useEffect(() => {
    if (!hasHydrated) return

    if (userRole !== 'ADMIN') {
      router.replace(ROUTES.ADMIN_LOGIN)
    } else {
      setIsAuthorized(true)
    }
  }, [hasHydrated, userRole, router])

  if (!hasHydrated || !isAuthorized) {
    return null
  }

  return <>{children}</>
}
