import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import ProductDetail from '@/features/product-detail/ProductDetail'
import { fetchProductDetail } from '@/lib/api/server/products'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await fetchProductDetail(id)

  if (!product) {
    return { title: '상품을 찾을 수 없습니다 | 커들마켓' }
  }

  const title = `${product.title} | 커들마켓`
  const description = product.description?.slice(0, 155) || '커들마켓에서 반려동물 용품을 만나보세요'

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://cuddle-market.vercel.app/products/${id}`,
      siteName: '커들마켓',
      images: product.mainImageUrl ? [{ url: product.mainImageUrl }] : [{ url: '/og-image.png' }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.mainImageUrl ? [product.mainImageUrl] : ['/og-image.png'],
    },
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params
  const initialData = await fetchProductDetail(id)

  if (!initialData) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: initialData.title,
    description: initialData.description,
    image: [initialData.mainImageUrl, ...(initialData.subImageUrls ?? [])],
    offers: {
      '@type': 'Offer',
      price: initialData.price,
      priceCurrency: 'KRW',
      availability:
        initialData.tradeStatus === 'SELLING'
          ? 'https://schema.org/InStock'
          : initialData.tradeStatus === 'RESERVED'
            ? 'https://schema.org/LimitedAvailability'
            : 'https://schema.org/SoldOut',
      itemCondition:
        initialData.productStatus === 'NEW'
          ? 'https://schema.org/NewCondition'
          : 'https://schema.org/UsedCondition',
      url: `https://cuddle-market.vercel.app/products/${id}`,
      seller: {
        '@type': 'Person',
        name: initialData.sellerInfo.sellerNickname,
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <ProductDetail initialData={initialData} />
      </Suspense>
    </>
  )
}
