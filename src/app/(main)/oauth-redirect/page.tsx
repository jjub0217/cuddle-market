import { Suspense } from 'react'
import SocialCallback from '@/features/SocialCallback'

// 동적 렌더링 강제 (소셜 로그인 콜백은 항상 동적)
export const dynamic = 'force-dynamic'

export default function OAuthRedirectPage() {
  return (
    <Suspense fallback={null}>
      <SocialCallback />
    </Suspense>
  )
}
