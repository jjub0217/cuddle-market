import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

import CommunityPage from '@/features/community/CommunityPage'

export default function CommunityRoute() {
  return (
    <Suspense fallback={null}>
      <CommunityPage />
    </Suspense>
  )
}
