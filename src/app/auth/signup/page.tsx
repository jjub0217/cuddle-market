import { Suspense } from 'react'
import Signup from '@/features/signup/Signup'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <Signup />
    </Suspense>
  )
}
