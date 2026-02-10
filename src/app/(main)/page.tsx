import { Suspense } from 'react'
import Home from '@/features/home/Home'
import StaticHomeFallback from '@/features/home/components/StaticHomeFallback'
import { fetchInitialProducts } from '@/lib/api/server/products'
import { getImageSrcSet, IMAGE_SIZES } from '@/lib/utils/imageUrl'

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
