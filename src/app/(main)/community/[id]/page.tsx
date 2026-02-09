import { Suspense } from 'react'
import CommunityDetail from '@/features/community/CommunityDetail'

export const dynamic = 'force-dynamic'

export default function CommunityDetailPage() {
  return (
    <Suspense fallback={null}>
      <CommunityDetail />
    </Suspense>
  )
}
