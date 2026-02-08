import { Suspense } from 'react'
import Home from '@/features/home/Home'

export default function HomePage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  )
}
