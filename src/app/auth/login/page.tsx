import { Suspense } from 'react'
import Login from '@/features/login/Login'

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  )
}
