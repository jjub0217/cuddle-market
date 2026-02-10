// import { Suspense } from 'react'
import Home from '@/features/home/Home'
// import HomeSkeleton from '@/features/home/components/product-section/HomeSkeleton'
import { fetchInitialProducts } from '@/lib/api/server/products'

export default async function HomePage() {
  const initialData = await fetchInitialProducts()
  return (
    <Home initialData={initialData} />
    //  <Suspense fallback={<HomeSkeleton />}>
    //  </Suspense>
  )
}
