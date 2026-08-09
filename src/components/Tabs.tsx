'use client'

import Button from '@/components/commons/button/Button'
import { cn } from '@/lib/utils/cn'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { KeyboardEvent } from 'react'

interface Tab {
  id: string
  label: string
  code: string
  bgColor?: string
  value?: string
  name?: string
}

type TabsVariant = 'default' | 'card-pill'

interface TabsProps {
  tabs: readonly Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  ariaLabel: string
  excludeTabId?: string
  variant?: TabsVariant
}

const VARIANT_STYLES: Record<TabsVariant, { container: string; tab: string; tabActive: string; tabInactive: string }> = {
  default: {
    container: 'flex w-fit gap-1 md:gap-2.5',
    // 글자 14 는 아래 card-pill·Button 과 같은 값이다. 전에는 md:text-base 라
    // 데스크탑에서만 16 이 되어, 같은 Tabs 인데 변형에 따라 글자가 갈렸다(#847).
    // 높이(py-2 로 40)는 그대로 둔다 — Button 의 md 와 같은 값이라 어긋난 곳이 아니다.
    tab: 'flex-1 cursor-pointer rounded-full px-4 py-2 text-sm whitespace-nowrap xl:rounded-2xl',
    tabActive: 'bg-primary-600 font-bold text-white',
    tabInactive: 'bg-primary-100 xl:bg-white hover:bg-primary-600 hover:text-white text-gray-900',
  },
  'card-pill': {
    container: 'flex flex-wrap items-center gap-2',
    // h-8 (32) — Button 의 md(40)·sm(36)보다 작다. 목록 위에 늘어서는 칩이라
    // 단추만 한 크기면 화면을 잡아먹는다. 모바일은 한 단계 더 작다(#847).
    tab: 'h-8 cursor-pointer rounded-full border px-5 py-1.5 text-sm whitespace-nowrap transition-all max-md:h-7 max-md:px-4 max-md:py-1 max-md:font-normal',
    tabActive: 'border-[#825500] bg-[#825500] text-white shadow-sm',
    tabInactive: 'border-[#d4c4b2] bg-white text-gray-600 hover:border-[#825500] hover:text-[#825500]',
  },
}

export default function Tabs({ tabs, activeTab, onTabChange, ariaLabel, excludeTabId, variant = 'default' }: TabsProps) {
  const filteredTabs = excludeTabId ? tabs.filter((tab) => tab.id !== excludeTabId) : tabs
  const isMd = useMediaQuery('(min-width: 768px)')

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = filteredTabs.findIndex((tab) => tab.id === activeTab)
    let nextIndex: number | null = null

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % filteredTabs.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + filteredTabs.length) % filteredTabs.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = filteredTabs.length - 1
        break
      default:
        return
    }

    e.preventDefault()
    const nextTab = filteredTabs[nextIndex]
    onTabChange(nextTab.id)
    document.getElementById(nextTab.id)?.focus()
  }

  const styles = VARIANT_STYLES[variant]

  return (
    <div role="tablist" aria-label={ariaLabel} onKeyDown={handleKeyDown} className={styles.container}>
      {filteredTabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <Button
            key={tab.id}
            id={tab.id}
            size={isMd ? 'md' : 'sm'}
            role="tab"
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(styles.tab, isActive ? styles.tabActive : styles.tabInactive)}
            aria-selected={isActive}
            aria-controls={`panel-${tab.code}`}
            tabIndex={isActive ? 0 : -1}
          >
            {tab.label}
          </Button>
        )
      })}
    </div>
  )
}
