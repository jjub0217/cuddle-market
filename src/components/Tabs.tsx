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

interface TabsProps {
  tabs: readonly Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  ariaLabel: string
  excludeTabId?: string
}

export default function Tabs({ tabs, activeTab, onTabChange, ariaLabel, excludeTabId }: TabsProps) {
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

  return (
    <div role="tablist" aria-label={ariaLabel} onKeyDown={handleKeyDown} className={cn('border-b-primary-200 flex gap-1 md:gap-2.5 md:border-b-2 md:pb-1')}>
      {filteredTabs.map((tab) => (
        <Button
          key={tab.id}
          id={tab.id}
          size={isMd ? 'md' : 'sm'}
          role="tab"
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 cursor-pointer rounded-full bg-white text-base whitespace-nowrap md:rounded-2xl md:bg-transparent',
            activeTab === tab.id
              ? 'md:bg-primary-300 bg-primary-500 font-bold text-white'
              : 'md:hover:bg-primary-100 bg-gray-100 text-gray-900 md:bg-transparent',
          )}
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.code}`}
          tabIndex={activeTab === tab.id ? 0 : -1}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}
