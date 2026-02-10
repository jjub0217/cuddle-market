import { Suspense } from 'react'
import Home from '@/features/home/Home'
import HomeSkeleton from '@/features/home/components/product-section/HomeSkeleton'
import { fetchInitialProducts } from '@/lib/api/server/products'
import { getImageSrcSet, IMAGE_SIZES } from '@/lib/utils/imageUrl'

export default async function HomePage() {
  const initialData = await fetchInitialProducts()
  const firstImageUrl = initialData?.data?.data?.content?.[0]?.mainImageUrl

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
      <Suspense fallback={<HomeSkeleton />}>
        <Home initialData={initialData} />
      </Suspense>
    </>
  )
}
