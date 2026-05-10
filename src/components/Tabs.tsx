'use client'

import Button from '@/components/commons/button/Button'
import { cn } from '@/lib/utils/cn'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { KeyboardEvent } from 'react'

interface Tab {
  id: string
  label: string
  code: string
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
    tab: 'bg-primary-100 flex-1 cursor-pointer rounded-full px-4 py-2 text-sm whitespace-nowrap md:text-base xl:rounded-2xl xl:bg-white',
    tabActive: 'bg-primary-500 xl:bg-primary-300 font-bold text-white',
    tabInactive: 'hover:bg-primary-500 hover:text-white text-gray-900',
  },
  'card-pill': {
    container: 'flex flex-wrap items-center gap-2',
    tab: 'cursor-pointer rounded-full px-5 py-1.5 text-sm  whitespace-nowrap transition-all',
    tabActive: 'bg-[#825500] text-white shadow-sm',
    tabInactive: 'border border-[#d4c4b2] bg-white text-gray-600 hover:border-[#825500] hover:text-[#825500]',
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
