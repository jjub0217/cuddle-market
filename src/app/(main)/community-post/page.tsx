import { Suspense } from 'react'
import CommunityPostForm from '@/features/community/components/CommunityPostForm'

export const dynamic = 'force-dynamic'

export default function CommunityPostPage() {
  return (
    <Suspense fallback={null}>
      <CommunityPostForm />
    </Suspense>
  )
}
