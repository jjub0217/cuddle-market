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
  /**
   * 「전체보기」를 눌렀을 때. **모바일에서만 준다.**
   *
   * ⚠️ 안 주면 `?nav=` 링크로 간다 — 데스크탑은 그걸로 화면이 바뀌지만 **모바일에서는
   *    아무 일도 안 일어난다.** 모바일은 `effectiveNav` 를 늘 `nav-dash` 로 덮기 때문이다
   *    (`MyPage.tsx:65`). 모바일이 쓰는 길은 `?panel=` 이다(#819).
   */
  onSeeAll?: (tab: DashboardTab) => void
}

type DashboardTab = 'sales' | 'purchases' | 'wishlist'

interface TabConfig {
  label: string
  nav: string
  tab: string
}

const TAB_CONFIG: Record<DashboardTab, TabConfig> = {
  sales: { label: '판매 내역', nav: 'nav-sales', tab: 'tab-sales' },
  // ⚠️ 열쇠·nav·tab 이름은 `purchases` 지만 문구는 「판매요청 내역」이다. 내가 산 물건이
  //    아니라 내가 올린 판매요청 글이다. **이름은 고치지 마라, 문구만이다**
  purchases: { label: '판매요청 내역', nav: 'nav-purchases', tab: 'tab-purchases' },
  wishlist: { label: '찜한 상품', nav: 'nav-wishlist', tab: 'tab-wishlist' },
}

const TAB_ORDER: DashboardTab[] = ['sales', 'purchases', 'wishlist']

const DASHBOARD_TABS_LIST: { id: DashboardTab; label: string; code: DashboardTab }[] = TAB_ORDER.map((id) => ({
  id,
  label: TAB_CONFIG[id].label,
  code: id,
}))

export default function MyDashboard({ myProducts, myRequests, myFavorites, onSeeAll }: MyDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('sales')

  const dataMap: Record<DashboardTab, Product[] | undefined> = {
    sales: myProducts,
    purchases: myRequests,
    wishlist: myFavorites,
  }

  const currentData = dataMap[activeTab]?.slice(0, 4) ?? []
  const currentConfig = TAB_CONFIG[activeTab]

  return (
    <div className="flex flex-col md:gap-8">
      {/* 거래 내역 요약 */}
      <section className="bg-surface-container-lowest border-outline-variant/40 border-b p-5 md:rounded-2xl md:border">
        <UnderlineTabs
          tabs={DASHBOARD_TABS_LIST}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as DashboardTab)}
          ariaLabel="대시보드 거래 탭"
          className="mb-6"
          rightSlot={
            onSeeAll ? (
              // 모바일: 주소의 ?panel= 로 전체 화면 패널을 연다
              <button
                type="button"
                onClick={() => onSeeAll(activeTab)}
                className="text-primary flex cursor-pointer items-center gap-1 text-sm font-semibold hover:underline"
              >
                전체보기
                <ChevronRight size={16} />
              </button>
            ) : (
              // 데스크탑: 옆 nav 를 바꾼다
              <Link
                href={`?nav=${currentConfig.nav}&tab=${currentConfig.tab}`}
                className="text-primary flex items-center gap-1 text-sm font-semibold hover:underline"
              >
                전체보기
                <ChevronRight size={16} />
              </Link>
            )
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
      <section className="grid grid-cols-1 md:gap-8 lg:grid-cols-2">
        <div className="bg-surface-container-lowest border-outline-variant/40 border-b p-6 md:rounded-2xl md:border md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-on-surface text-base font-bold">나의 커뮤니티 글</h2>
            <Link href="?nav=nav-activity" className="text-primary flex items-center gap-1 text-sm font-bold hover:underline">
              전체보기
              <ChevronRight size={16} />
            </Link>
          </div>
          <p className="text-on-surface-muted py-8 text-center text-sm">작성한 커뮤니티 글이 없습니다.</p>
        </div>

        <div className="bg-surface-container-lowest border-outline-variant/40 p-6 md:rounded-2xl md:border md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-on-surface text-base font-bold">최근 작성한 댓글</h2>
            <Link href="?nav=nav-activity" className="text-primary flex items-center gap-1 text-sm font-bold hover:underline">
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
