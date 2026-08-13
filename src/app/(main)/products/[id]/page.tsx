import { notFound, redirect } from 'next/navigation'
import { fetchProductDetail } from '@/lib/api/server/products'
import { productDetailPath } from '@/lib/utils/detailPath'

interface ProductRedirectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductRedirectPage({ params }: ProductRedirectPageProps) {
  const { id } = await params
  const product = await fetchProductDetail(id)

  if (!product) {
    notFound()
  }

  redirect(productDetailPath(id, product.title))
}
