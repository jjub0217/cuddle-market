'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface Tab {
  id: string
  label: string
  code: string
}

interface UnderlineTabsProps {
  tabs: readonly Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  ariaLabel: string
  excludeTabId?: string
  className?: string
  rightSlot?: ReactNode
}

export function UnderlineTabs({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
  excludeTabId,
  className,
  rightSlot,
}: UnderlineTabsProps) {
  const filteredTabs = excludeTabId ? tabs.filter((tab) => tab.id !== excludeTabId) : tabs

  return (
    <div className={cn('border-outline-variant/30 flex items-center justify-between border-b', className)}>
      <div role="tablist" aria-label={ariaLabel} className="flex gap-6 md:gap-10">
        {filteredTabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={tab.id}
              type="button"
              role="tab"
              onClick={() => onTabChange(tab.id)}
              aria-selected={isActive}
              aria-controls={`panel-${tab.code}`}
              tabIndex={isActive ? 0 : -1}
              className={cn(
                'cursor-pointer pb-3 text-sm font-semibold transition-all md:pb-1',
                isActive ? 'border-primary text-primary border-b-2' : 'text-on-surface-muted hover:text-primary'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {rightSlot ? <div className="pb-3 md:pb-1">{rightSlot}</div> : null}
    </div>
  )
}
