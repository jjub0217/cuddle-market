import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

import ProductPost from '@/features/product-post/ProductPost'

export default function ProductPostPage() {
  return (
    <Suspense fallback={null}>
      <ProductPost />
    </Suspense>
  )
}
