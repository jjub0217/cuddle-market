'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'
import { useUserStore } from '@/store/userStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export default function Providers({ children }: { children: ReactNode }) {
  const validateAuthState = useUserStore((state) => state.validateAuthState)

  useEffect(() => {
    validateAuthState()
  }, [validateAuthState])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
