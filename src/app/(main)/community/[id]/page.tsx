import { Suspense } from 'react'
import CommunityDetail from '@/features/community/CommunityDetail'
import CommunityDetailSkeleton from '@/features/community/components/CommunityDetailSkeleton'

export const dynamic = 'force-dynamic'

export default function CommunityDetailPage() {
  return (
    <Suspense fallback={<CommunityDetailSkeleton />}>
      <CommunityDetail />
    </Suspense>
  )
}
