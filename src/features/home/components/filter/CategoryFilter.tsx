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
    <div className="flex flex-col gap-4 pt-3 md:pt-2">
      <div
        className="scrollbar-hide -mx-2 flex items-start gap-3 overflow-x-auto px-2 pb-2 md:gap-5"
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
              className="group flex shrink-0 flex-col items-center gap-1 rounded-none bg-transparent p-0 transition-all hover:bg-transparent md:min-w-20 md:gap-0"
            >
              <span className="bg-primary-50 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full transition-all group-hover:-translate-y-1 md:h-20 md:w-20 md:overflow-visible md:rounded-none md:bg-transparent">
                <Image
                  src={category.iconImage}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 object-cover md:h-16 md:w-16 md:object-contain"
                />
              </span>
              <span className="text-xs whitespace-nowrap text-gray-600 transition-colors group-hover:text-[#825500] md:text-sm md:font-bold">
                {category.name}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
