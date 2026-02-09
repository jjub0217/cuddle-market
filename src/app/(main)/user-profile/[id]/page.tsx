import { Suspense } from 'react'
import UserPage from '@/features/UserPage'

export const dynamic = 'force-dynamic'

export default function UserProfilePage() {
  return (
    <Suspense fallback={null}>
      <UserPage />
    </Suspense>
  )
}
