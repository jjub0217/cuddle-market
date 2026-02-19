import { notFound, redirect } from 'next/navigation'
import { fetchProductDetail } from '@/lib/api/server/products'
import { toUrlName } from '@/lib/utils/toUrlName'

interface ProductRedirectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductRedirectPage({ params }: ProductRedirectPageProps) {
  const { id } = await params
  const product = await fetchProductDetail(id)

  if (!product) {
    notFound()
  }

  redirect(`/products/${id}/${toUrlName(product.title)}`)
}
