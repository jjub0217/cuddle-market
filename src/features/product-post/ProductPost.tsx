'use client'

import SimpleHeader from '@/components/header/SimpleHeader'
import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { PRODUCT_TYPE_TABS, type ProductTypeTabId } from '@/constants/constants'
import Tabs from '@/components/Tabs'
import { ProductPostForm } from './components/ProductPostForm'
import { ProductRequestForm } from './components/ProductRequestForm'
import { fetchProductById } from '@/lib/api/products'
import type { ProductDetailItem } from '@/types'
import { useUserStore } from '@/store/userStore'

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
          const data = await fetchProductById(id)
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

  return (
    <>
      <h1 className="sr-only">{headerTitle}</h1>
      <SimpleHeader title={headerTitle} description={headerDescription} />
      <div className="bg-[#F3F4F6] pt-5">
        <div className="px-lg pb-4xl mx-auto max-w-7xl">
          <div className="gap-2xl flex w-full flex-col">
            {!isEditMode && (
              <Tabs
                tabs={PRODUCT_TYPE_TABS}
                activeTab={activeProductTypeTab}
                onTabChange={handleTabChange}
                ariaLabel="상품 타입"
                excludeTabId="tab-all"
              />
            )}
            {activeProductTypeTab === 'tab-sales' && (
              <ProductPostForm isEditMode={isEditMode} productId={id} initialData={productData} />
            )}
            {activeProductTypeTab === 'tab-purchases' && (
              <ProductRequestForm isEditMode={isEditMode} productId={id} initialData={productData} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ProductPost
