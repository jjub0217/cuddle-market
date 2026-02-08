import { Suspense } from 'react'
import Signup from '@/features/signup/Signup'

export default function SignupPage() {
  return (
    <Suspense>
      <Signup />
    </Suspense>
  )
}
