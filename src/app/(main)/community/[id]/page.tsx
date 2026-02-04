import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

import CommunityDetail from '@/features/community/CommunityDetail'

export default function CommunityDetailPage() {
  return (
    <Suspense fallback={null}>
      <CommunityDetail />
    </Suspense>
  )
}
