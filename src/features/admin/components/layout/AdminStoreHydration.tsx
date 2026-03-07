'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store/userStore'

export default function AdminStoreHydration() {
  useEffect(() => {
    useUserStore.persist.rehydrate()
  }, [])

  return null
}
