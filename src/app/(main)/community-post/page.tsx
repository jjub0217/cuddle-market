import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

import CommunityPostForm from '@/features/community/components/CommunityPostForm'

export default function CommunityPostPage() {
  return (
    <Suspense fallback={null}>
      <CommunityPostForm />
    </Suspense>
  )
}
