import Button from '@/components/commons/button/Button'
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
}

export function CommunityTabs({ tabs, activeTab, onTabChange, ariaLabel, excludeTabId }: TabsProps) {
  const filteredTabs = excludeTabId ? tabs.filter((tab) => tab.id !== excludeTabId) : tabs
  return (
    <div role="tablist" aria-label={ariaLabel} className={cn('border-b-primary-200 flex w-fit gap-2.5 md:border-b-2 md:pb-1')}>
      {filteredTabs.map((tab) => (
        <Button
          key={tab.id}
          id={tab.id}
          size="md"
          role="tab"
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'cursor-pointer rounded-full bg-white text-base md:rounded-2xl md:bg-transparent',
            activeTab === tab.id
              ? 'md:bg-primary-300 bg-primary-500 font-bold text-white'
              : 'hover:bg-primary-100 bg-gray-100 text-gray-900 md:bg-transparent'
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
