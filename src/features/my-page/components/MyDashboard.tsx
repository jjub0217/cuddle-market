'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { UnderlineTabs } from '@/components/UnderlineTabs'
import type { Product } from '@/types'

interface MyDashboardProps {
  myProducts?: Product[]
  myRequests?: Product[]
  myFavorites?: Product[]
}

type DashboardTab = 'sales' | 'purchases' | 'wishlist'

interface TabConfig {
  label: string
  nav: string
  tab: string
}

const TAB_CONFIG: Record<DashboardTab, TabConfig> = {
  sales: { label: '판매 내역', nav: 'nav-sales', tab: 'tab-sales' },
  purchases: { label: '구매 내역', nav: 'nav-purchases', tab: 'tab-purchases' },
  wishlist: { label: '찜한 상품', nav: 'nav-wishlist', tab: 'tab-wishlist' },
}

const TAB_ORDER: DashboardTab[] = ['sales', 'purchases', 'wishlist']

const DASHBOARD_TABS_LIST: { id: DashboardTab; label: string; code: DashboardTab }[] = TAB_ORDER.map((id) => ({
  id,
  label: TAB_CONFIG[id].label,
  code: id,
}))

export default function MyDashboard({ myProducts, myRequests, myFavorites }: MyDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('sales')

  const dataMap: Record<DashboardTab, Product[] | undefined> = {
    sales: myProducts,
    purchases: myRequests,
    wishlist: myFavorites,
  }

  const currentData = dataMap[activeTab]?.slice(0, 4) ?? []
  const currentConfig = TAB_CONFIG[activeTab]

  return (
    <div className="flex flex-col gap-8">
      {/* 거래 내역 요약 */}
      <section className="bg-surface-container-lowest border-outline-variant/40 rounded-2xl border p-6 md:p-8">
        <UnderlineTabs
          tabs={DASHBOARD_TABS_LIST}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as DashboardTab)}
          ariaLabel="대시보드 거래 탭"
          className="mb-6"
          rightSlot={
            <Link
              href={`?nav=${currentConfig.nav}&tab=${currentConfig.tab}`}
              className="text-primary flex items-center gap-1 text-sm font-bold hover:underline"
            >
              전체보기
              <ChevronRight size={16} />
            </Link>
          }
        />
        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={activeTab}>
          {currentData.length === 0 ? (
            <p className="text-on-surface-muted py-12 text-center text-sm">표시할 항목이 없습니다.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {currentData.map((product, index) => (
                <li key={product.id}>
                  <ProductCard data-index={index} data={product} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 활동 요약 */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-surface-container-lowest border-outline-variant/40 rounded-2xl border p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-on-surface text-lg font-bold">나의 커뮤니티 글</h2>
            <Link
              href="?nav=nav-activity"
              className="text-primary flex items-center gap-1 text-sm font-bold hover:underline"
            >
              전체보기
              <ChevronRight size={16} />
            </Link>
          </div>
          <p className="text-on-surface-muted py-8 text-center text-sm">작성한 커뮤니티 글이 없습니다.</p>
        </div>

        <div className="bg-surface-container-lowest border-outline-variant/40 rounded-2xl border p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-on-surface text-lg font-bold">최근 작성한 댓글</h2>
            <Link
              href="?nav=nav-activity"
              className="text-primary flex items-center gap-1 text-sm font-bold hover:underline"
            >
              전체보기
              <ChevronRight size={16} />
            </Link>
          </div>
          <p className="text-on-surface-muted py-8 text-center text-sm">작성한 댓글이 없습니다.</p>
        </div>
      </section>
    </div>
  )
}
