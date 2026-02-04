import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

import Home from '@/features/home/Home'

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <Home />
    </Suspense>
  )
}
