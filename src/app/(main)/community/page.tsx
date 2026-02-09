import { Suspense } from 'react'
import CommunityPage from '@/features/community/CommunityPage'

export const dynamic = 'force-dynamic'

export default function CommunityRoute() {
  return (
    <Suspense fallback={null}>
      <CommunityPage />
    </Suspense>
  )
}
