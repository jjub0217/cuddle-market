import { Suspense } from 'react'
import FindAccountPage from '@/features/find-account/FindAccountPage'

export const dynamic = 'force-dynamic'

export default function FindAccountRoute() {
  return (
    <Suspense fallback={null}>
      <FindAccountPage />
    </Suspense>
  )
}
