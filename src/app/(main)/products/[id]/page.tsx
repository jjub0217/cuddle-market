import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ProductDetail from '@/features/product-detail/ProductDetail'
import { fetchProductDetail } from '@/lib/api/server/products'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const initialData = await fetchProductDetail(id)

  if (!initialData) {
    notFound()
  }

  return (
    <Suspense fallback={null}>
      <ProductDetail initialData={initialData} />
    </Suspense>
  )
}
