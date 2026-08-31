'use client'

import SimpleHeader from '@/components/header/SimpleHeader'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { PRODUCT_TYPE_TABS, type ProductTypeTabId } from '@/constants/constants'
import Tabs from '@/components/Tabs'
import { ProductPostForm } from './components/ProductPostForm'
import { ProductRequestForm } from './components/ProductRequestForm'
import { fetchGraphQL } from '@/lib/api/graphql'
import type { ProductDetailItem } from '@/types'
import { useUserStore } from '@/store/userStore'
import MobileBackHeader from '@/components/header/MobileBackHeader'
import Spinner from '@/components/commons/spinner/Spinner'
import { PAGE_CONTAINER } from '@/constants/ui'
import { cn } from '@/lib/utils/cn'

function ProductPost() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as ProductTypeTabId | null
  const initialTab = tabParam === 'tab-purchases' ? 'tab-purchases' : 'tab-sales'

  const [activeProductTypeTab, setActiveProductTypeTab] = useState<ProductTypeTabId>(initialTab)
  const [productData, setProductData] = useState<ProductDetailItem | null>(null)
  const params = useParams()
  const id = params.id as string | undefined
  const { user, _hasHydrated, setRedirectUrl } = useUserStore()

  const isEditMode = !!id

  const isSalesTab = activeProductTypeTab === 'tab-sales'
  const headerTitle = isSalesTab
    ? isEditMode
      ? '판매 상품 수정'
      : '판매 상품 등록'
    : isEditMode
      ? '판매 요청 수정'
      : '판매 요청 등록'
  const headerDescription = isSalesTab
    ? isEditMode
      ? '등록된 상품 정보를 수정할 수 있습니다.'
      : '상품을 등록하여 다른 사용자들에게 판매할 수 있습니다.'
    : isEditMode
      ? '등록된 판매 요청 정보를 수정할 수 있습니다.'
      : '원하는 상품이 없을 때 판매를 요청할 수 있습니다.'

  const handleTabChange = (tabId: string) => {
    setActiveProductTypeTab(tabId as ProductTypeTabId)
    router.replace(`?tab=${tabId}`)
  }

  // 비로그인 시 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (_hasHydrated && !user?.id) {
      setRedirectUrl(window.location.pathname)
      router.push('/auth/login')
    }
  }, [_hasHydrated, user, router, setRedirectUrl])

  useEffect(() => {
    const loadProduct = async () => {
      if (isEditMode && id) {
        try {
          const { product: data } = await fetchGraphQL<{ product: ProductDetailItem }>(
            `
            query Product($id: Int!) {
              product(id: $id) {
                id title description price mainImageUrl subImageUrls productType tradeStatus
                petType petDetailType category productStatus addressSido addressGugun
                createdAt viewCount favoriteCount isFavorite
                sellerInfo { sellerId sellerNickname sellerProfileImageUrl }
                sellerOtherProducts { id title price mainImageUrl }
              }
            }
          `,
            { id: Number(id) }
          )
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setProductData(data)
          const tabId = data.productType === 'SELL' ? 'tab-sales' : 'tab-purchases'
          setActiveProductTypeTab(tabId)
        } catch {
          router.push('/')
        }
      }
    }
    loadProduct()
  }, [id, isEditMode, router])

  if (isEditMode && !productData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  return (
    <>
      <h1 className="sr-only">{headerTitle}</h1>
      {/* 모바일 서브헤더 — 커뮤니티 글 작성과 같은 조각을 쓴다 */}
      <MobileBackHeader title={headerTitle} />
      {/* 데스크톱 서브헤더 */}
      <div className="hidden md:block">
        <SimpleHeader
          title={headerTitle}
          description={headerDescription}
          layoutClassname="py-3.5 gap-0 flex-col justify-between pt-8"
          titleClassName="text-[22px] leading-[1.5] font-bold"
          descriptionClassName="text-sm"
        />
      </div>
      <div className="pt-5">
        <div className={cn(PAGE_CONTAINER, 'pb-4xl')}>
          <div className="gap-2xl flex w-full flex-col">
            {!isEditMode ? (
              <Tabs
                tabs={PRODUCT_TYPE_TABS}
                activeTab={activeProductTypeTab}
                onTabChange={handleTabChange}
                ariaLabel="상품 타입"
              />
            ) : null}
            {activeProductTypeTab === 'tab-sales' ? (
              <ProductPostForm isEditMode={isEditMode} productId={id} initialData={productData} />
            ) : null}
            {activeProductTypeTab === 'tab-purchases' ? (
              <ProductRequestForm isEditMode={isEditMode} productId={id} initialData={productData} />
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductPost
