import { cn } from '@/lib/utils/cn'

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
  className?: string
}

export function CommunityTabs({ tabs, activeTab, onTabChange, ariaLabel, excludeTabId, className }: TabsProps) {
  const filteredTabs = excludeTabId ? tabs.filter((tab) => tab.id !== excludeTabId) : tabs
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('border-outline-variant/30 flex gap-6 border-b md:gap-10', className)}
    >
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
              'cursor-pointer pb-3 text-base font-semibold transition-all md:pb-1',
              isActive ? 'border-b-2 border-[#633f00] text-[#633f00]' : 'text-[#504537] hover:text-[#633f00]'
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
