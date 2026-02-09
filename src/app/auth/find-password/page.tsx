import { Suspense } from 'react'
import FindPasswordPage from '@/features/find-password/FindPasswordPage'

export const dynamic = 'force-dynamic'

export default function FindPasswordRoute() {
  return (
    <Suspense fallback={null}>
      <FindPasswordPage />
    </Suspense>
  )
}
