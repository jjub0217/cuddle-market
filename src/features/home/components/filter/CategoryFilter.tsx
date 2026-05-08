'use client'

import { PRODUCT_CATEGORIES } from '@/constants/constants'
import { cn } from '@/lib/utils/cn'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import {
  Cookie,
  Gamepad2,
  Home,
  HeartPulse,
  Shirt,
  Backpack,
  Scissors,
  MoreHorizontal,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import Button from '@/components/commons/button/Button'

interface CategoryFilterProps {
  headingClassName?: string
  selectedCategory?: string | null
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  FOOD: Cookie,
  TOY: Gamepad2,
  HOUSE: Home,
  HEALTH: HeartPulse,
  CLOTHING: Shirt,
  WALKING: Backpack,
  GROOMING: Scissors,
  ETC: MoreHorizontal,
}

// "전체" 항목을 맨 앞에 두기 위한 sentinel — code: null
const ALL_ITEM = { code: null, name: '전체', icon: Sparkles } as const

interface CategoryItem {
  code: string | null
  name: string
  icon: LucideIcon
}

export function CategoryFilter({ selectedCategory }: CategoryFilterProps) {
  const { searchParams, pathname, push } = useFilterNavigation()

  const handleSelect = (e: React.MouseEvent, code: string | null) => {
    e.stopPropagation()
    const params = new URLSearchParams(searchParams.toString())
    if (code === null || selectedCategory === code) {
      params.delete('categories')
    } else {
      params.set('categories', code)
    }
    push(`${pathname}?${params.toString()}`)
  }

  const items: CategoryItem[] = [
    ALL_ITEM,
    ...PRODUCT_CATEGORIES.map((category) => ({
      code: category.code,
      name: category.name,
      icon: CATEGORY_ICONS[category.code] ?? MoreHorizontal,
    })),
  ]

  return (
    <div className="flex flex-col gap-4">
      <div
        className="scrollbar-hide -mx-2 flex items-start gap-4 overflow-x-auto px-2 pb-2 md:gap-6"
        role="group"
        aria-label="상품 카테고리"
      >
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.code === null ? !selectedCategory : selectedCategory === item.code
          return (
            <Button
              key={item.code ?? 'all'}
              type="button"
              size="sm"
              onClick={(e) => handleSelect(e, item.code)}
              aria-pressed={isActive}
              className="group flex min-w-18 shrink-0 flex-col items-center gap-2 rounded-none bg-transparent p-0 transition-all hover:bg-transparent"
            >
              <span
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-2xl transition-all group-hover:-translate-y-1 md:h-18 md:w-18',
                  isActive ? 'bg-[#825500] text-white shadow-md' : 'bg-[#f6efe2] text-[#825500] group-hover:bg-[#ecdcc3]'
                )}
              >
                <Icon size={28} strokeWidth={2} />
              </span>
              <span
                className={cn(
                  'whitespace-nowrap transition-colors md:text-sm',
                  isActive ? 'font-bold text-[#825500]' : 'font-medium text-gray-600 group-hover:text-[#825500]'
                )}
              >
                {item.name}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
