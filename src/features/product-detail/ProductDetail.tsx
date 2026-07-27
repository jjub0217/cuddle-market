'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/api'
import Footer from '@/components/footer/Footer'
import ProductDetailMobileMeta from './components/ProductDetailMobileMeta'
import MainImage from './components/MainImage'
import ProductBadges from './components/ProductBadges'
import ProductSummary from './components/ProductSummary'
import ProductDescription from './components/ProductDescription'
import ProductActions from './components/ProductActions'
import SellerOtherProducts from './components/SellerOtherProducts'
import { useEffect } from 'react'
import type { ProductDetailItem } from '@/types/product'
import { getProductType } from '@/lib/utils/getProductType'
import { getTradeStatus } from '@/lib/utils/getTradeStatus'
import { getPetTypeName } from '@/lib/utils/getPetTypeName'
import { getCategory } from '@/lib/utils/getCategory'
import Breadcrumb from '@/components/commons/breadcrumb/Breadcrumb'

interface ProductDetailProps {
  initialData: ProductDetailItem
}

function ProductDetail({ initialData }: ProductDetailProps) {
  const params = useParams<{ id: string }>()
  const id = params.id

  const { data: restData } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`)
      return response.data.data as ProductDetailItem
    },
    enabled: !!id,
  })

  const data = restData ?? initialData

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <>
      <div className="px-lg pb-4xl mx-auto max-w-7xl pt-5 md:pt-8">
        <div className="flex flex-col gap-20">
          <div className="flex flex-col gap-4">
            <Breadcrumb
              items={[
                {
                  label: getPetTypeName(data.petDetailType),
                  href: `/?petDetailType=${encodeURIComponent(data.petDetailType)}`,
                },
                { label: getCategory(data.category), href: `/?categories=${encodeURIComponent(data.category)}` },
              ]}
              className="md:max-w-150"
            />
            <div className="flex flex-col justify-center gap-8 md:flex-row">
              <div className="flex flex-1 flex-col gap-4 md:max-w-150">
                <MainImage
                  mainImageUrl={data.mainImageUrl}
                  subImageUrls={data.subImageUrls}
                  title={data.title}
                  tradeStatus={getTradeStatus(data.tradeStatus)}
                  productTypeName={getProductType(data.productType)}
                />
              </div>

              <div className="flex flex-1 flex-col gap-5">
                <div className="flex flex-col gap-3 md:gap-6">
                  <div className="flex flex-col gap-3.5">
                    <ProductBadges productType={data.productType} productStatus={data.productStatus} />
                    <ProductSummary data={data} />
                  </div>
                  <ProductDescription description={data.description} />
                  <ProductDetailMobileMeta
                    productId={data.id}
                    productTitle={data.title}
                    viewCount={data.viewCount}
                    favoriteCount={data.favoriteCount}
                  />
                </div>
                {/* 비로그인 조회 시 isFavorite이 null → 찜 토글 초기값은 false로 */}
                <ProductActions {...data} isFavorite={data.isFavorite ?? false} />
              </div>
            </div>
          </div>
          <SellerOtherProducts {...data} />
        </div>
      </div>
      <Footer />
    </>
  )
}

export default ProductDetail
