'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, type ReactNode } from 'react'
import { useUserStore } from '@/store/userStore'

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )
  const validateAuthState = useUserStore((state) => state.validateAuthState)

  useEffect(() => {
    validateAuthState()
  }, [validateAuthState])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
