import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

import MyPage from '@/features/my-page/MyPage'

export default function MyPageRoute() {
  return (
    <Suspense fallback={null}>
      <MyPage />
    </Suspense>
  )
}
