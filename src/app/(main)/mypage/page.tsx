import { Suspense } from 'react'
import MyPage from '@/features/my-page/MyPage'

export const dynamic = 'force-dynamic'

export default function MyPageRoute() {
  return (
    <Suspense fallback={null}>
      <MyPage />
    </Suspense>
  )
}
