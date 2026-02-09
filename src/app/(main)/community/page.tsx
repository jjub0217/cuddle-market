import { Suspense } from 'react'
import CommunityPage from '@/features/community/CommunityPage'
import CommunityListSkeleton from '@/features/community/components/CommunityListSkeleton'

export const dynamic = 'force-dynamic'

export default function CommunityRoute() {
  return (
    <Suspense fallback={<CommunityListSkeleton />}>
      <CommunityPage />
    </Suspense>
  )
}
