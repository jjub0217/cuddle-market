import { Suspense } from 'react'
import ProfileUpdate from '@/features/profile-update/ProfileUpdate'

export const dynamic = 'force-dynamic'

export default function ProfileUpdatePage() {
  return (
    <Suspense fallback={null}>
      <ProfileUpdate />
    </Suspense>
  )
}
