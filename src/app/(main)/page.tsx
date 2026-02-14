import type { Metadata } from 'next'
import { Suspense } from 'react'
import Home from '@/features/home/Home'
import StaticHomeFallback from '@/features/home/components/StaticHomeFallback'
import { fetchInitialProducts } from '@/lib/api/server/products'
import { getImageSrcSet, IMAGE_SIZES } from '@/lib/utils/imageUrl'

export const metadata: Metadata = {
  title: '커들마켓 | 반려동물 용품 중고거래',
  description: '반려동물 용품을 사고팔 수 있는 따뜻한 중고거래 플랫폼, 커들마켓',
  openGraph: {
    title: '커들마켓 | 반려동물 용품 중고거래',
    description: '반려동물 용품을 사고팔 수 있는 따뜻한 중고거래 플랫폼, 커들마켓',
    url: 'https://cuddle-market.vercel.app',
    siteName: '커들마켓',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '커들마켓 | 반려동물 용품 중고거래',
    description: '반려동물 용품을 사고팔 수 있는 따뜻한 중고거래 플랫폼, 커들마켓',
    images: ['/og-image.png'],
  },
}

export default async function HomePage() {
  const initialData = await fetchInitialProducts()
  const products = initialData?.data?.data?.content ?? []
  const totalElements = initialData?.data?.data?.totalElements ?? 0
  const firstImageUrl = products[0]?.mainImageUrl

  return (
    <>
      {firstImageUrl && (
        <link
          rel="preload"
          as="image"
          imageSrcSet={getImageSrcSet(firstImageUrl)}
          imageSizes={IMAGE_SIZES.productThumbnail}
          fetchPriority="high"
        />
      )}
      <Suspense fallback={<StaticHomeFallback products={products} totalElements={totalElements} />}>
        <Home initialData={initialData} />
      </Suspense>
    </>
  )
}
