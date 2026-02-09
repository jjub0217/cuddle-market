import { Suspense } from 'react'
import ProductPost from '@/features/product-post/ProductPost'

export const dynamic = 'force-dynamic'

export default function ProductPostPage() {
  return (
    <Suspense fallback={null}>
      <ProductPost />
    </Suspense>
  )
}
