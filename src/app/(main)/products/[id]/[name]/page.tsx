import type { Metadata } from 'next'
import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import ProductDetail from '@/features/product-detail/ProductDetail'
import { fetchProductDetail } from '@/lib/api/server/products'
import { toUrlName } from '@/lib/utils/toUrlName'
import { buildProductOgDescription, pickProductOgImage } from '@/lib/og/ogMeta'

interface ProductDetailPageProps {
  params: Promise<{ id: string; name: string }>
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await fetchProductDetail(id)

  if (!product) {
    return { title: '상품을 찾을 수 없습니다 | 커들마켓' }
  }

  const name = toUrlName(product.title)
  const title = `${product.title} | 커들마켓`
  const description = product.description?.slice(0, 155) || '커들마켓에서 반려동물 용품을 만나보세요'
  // 미리보기는 그림 안에 가격을 그리지 않는다. 가격·거래 상태를 설명 글자로 옮긴다(#1122).
  // 검색 결과에 뜨는 `description` 은 본문 그대로 둔다.
  const ogDescription = buildProductOgDescription(product)
  const ogImage = pickProductOgImage(product.mainImageUrl)

  return {
    title,
    description,
    alternates: {
      canonical: `/products/${id}/${name}`,
    },
    openGraph: {
      title,
      description: ogDescription,
      url: `https://cuddle-market.vercel.app/products/${id}/${name}`,
      siteName: '커들마켓',
      type: 'article',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: ogDescription,
      images: [ogImage],
    },
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id, name } = await params
  const initialData = await fetchProductDetail(id)

  if (!initialData) {
    notFound()
  }

  const correctName = toUrlName(initialData.title)
  if (decodeURIComponent(name) !== correctName) {
    redirect(`/products/${id}/${correctName}`)
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
      url: `https://cuddle-market.vercel.app/products/${id}/${correctName}`,
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
