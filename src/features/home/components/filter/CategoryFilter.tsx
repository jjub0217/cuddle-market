'use client'

import Image from 'next/image'
import { PRODUCT_CATEGORIES } from '@/constants/constants'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import Button from '@/components/commons/button/Button'

interface CategoryFilterProps {
  headingClassName?: string
  selectedCategory?: string | null
}

export function CategoryFilter({ selectedCategory }: CategoryFilterProps) {
  const { searchParams, pathname, push } = useFilterNavigation()

  // 같은 카테고리 재클릭 시 해제(toggle), 다른 카테고리 클릭 시 set
  const handleSelect = (e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    const params = new URLSearchParams(searchParams.toString())
    if (selectedCategory === code) {
      params.delete('categories')
    } else {
      params.set('categories', code)
    }
    push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 md:pt-2">
      <div
        className="scrollbar-hide -mx-2 flex items-start gap-5 overflow-x-auto px-2 pb-2"
        role="group"
        aria-label="상품 카테고리"
      >
        {PRODUCT_CATEGORIES.map((category) => {
          const isActive = selectedCategory === category.code
          return (
            <Button
              key={category.code}
              type="button"
              size="sm"
              onClick={(e) => handleSelect(e, category.code)}
              aria-pressed={isActive}
              className="group flex min-w-20 shrink-0 flex-col items-center rounded-none bg-transparent p-0 transition-all hover:bg-transparent"
            >
              <span className="flex h-20 w-20 items-center justify-center transition-all group-hover:-translate-y-1">
                <Image src={category.iconImage} alt="" width={64} height={64} className="h-16 w-16 object-contain" />
              </span>
              <span className="text-sm font-bold whitespace-nowrap text-gray-600 transition-colors group-hover:text-[#825500]">
                {category.name}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
