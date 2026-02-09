import { Suspense } from 'react'
import SocialCallback from '@/features/SocialCallback'

export const dynamic = 'force-dynamic'

export default function OAuthRedirectPage() {
  return (
    <Suspense fallback={null}>
      <SocialCallback />
    </Suspense>
  )
}
