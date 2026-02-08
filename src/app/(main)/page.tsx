import { Suspense } from 'react'
import Home from '@/features/home/Home'
import HomeSkeleton from '@/features/home/components/product-section/HomeSkeleton'

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home />
    </Suspense>
  )
}
