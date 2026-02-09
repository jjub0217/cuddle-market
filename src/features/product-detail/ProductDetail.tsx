'use client'

import { useRouter, useParams } from 'next/navigation'
import { fetchProductById } from '@/lib/api/products'
import { useQuery } from '@tanstack/react-query'
import Footer from '@/components/footer/Footer'
import MainImage from './components/MainImage'
import SubImages from './components/SubImages'
import SellerProfileCard from './components/SellerProfileCard'
import ProductBadges from './components/ProductBadges'
import ProductSummary from './components/ProductSummary'
import ProductDescription from './components/ProductDescription'
import ProductActions from './components/ProductActions'
import SellerOtherProducts from './components/SellerOtherProducts'
import { useEffect } from 'react'

function ProductDetail() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id!),
    enabled: !!id,
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p>상품 정보를 불러올 수 없습니다</p>
          <button onClick={() => router.push('/')} className="text-blue-600 hover:text-blue-800">
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-lg pb-4xl mx-auto max-w-7xl bg-white pt-8">
        <div className="flex flex-col gap-20">
          <div className="flex flex-col justify-center gap-8 md:flex-row">
            <div className="flex flex-1 flex-col gap-4">
              <MainImage {...data} />
              <SubImages {...data} />
              <SellerProfileCard sellerInfo={data.sellerInfo} />
            </div>

            <div className="flex flex-1 flex-col gap-3.5">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3.5">
                  <ProductBadges {...data} />
                  <ProductSummary data={data} />
                </div>
                <ProductDescription description={data.description} />
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
