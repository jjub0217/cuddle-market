import { Suspense } from 'react'
import ProductDetail from '@/features/product-detail/ProductDetail'

export const dynamic = 'force-dynamic'

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetail />
    </Suspense>
  )
}
