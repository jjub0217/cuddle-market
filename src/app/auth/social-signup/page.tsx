import { Suspense } from 'react'
import SocialSignup from '@/features/signup/SocialSignup'

export const dynamic = 'force-dynamic'

export default function SocialSignupPage() {
  return (
    <Suspense fallback={null}>
      <SocialSignup />
    </Suspense>
  )
}
