'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/api'
import Footer from '@/components/footer/Footer'
import ProductDetailMobileMeta from './components/ProductDetailMobileMeta'
import MainImage from './components/MainImage'
import SubImages from './components/SubImages'
import SellerProfileCard from './components/SellerProfileCard'
import ProductBadges from './components/ProductBadges'
import ProductSummary from './components/ProductSummary'
import ProductDescription from './components/ProductDescription'
import ProductActions from './components/ProductActions'
import SellerOtherProducts from './components/SellerOtherProducts'
import { useEffect } from 'react'
import type { ProductDetailItem } from '@/types/product'

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
      <div className="px-lg pb-4xl mx-auto max-w-7xl pt-8">
        <div className="flex flex-col gap-20">
          <div className="flex flex-col justify-center gap-8 md:flex-row">
            <div className="flex flex-1 flex-col gap-4 md:max-w-150">
              <MainImage {...data} />
              <SubImages {...data} />
              <SellerProfileCard sellerInfo={data.sellerInfo} />
            </div>

            <div className="flex flex-1 flex-col gap-5">
              <div className="flex flex-col gap-3 md:gap-6">
                <div className="flex flex-col gap-3.5">
                  <ProductBadges {...data} />
                  <ProductSummary data={data} />
                </div>
                <ProductDescription description={data.description} />
                <ProductDetailMobileMeta productId={data.id} productTitle={data.title} viewCount={data.viewCount} favoriteCount={data.favoriteCount} />
              </div>
              <ProductActions {...data} />
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
