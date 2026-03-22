'use client'

import Button from '@/components/commons/button/Button'
import { PRODUCT_CATEGORIES } from '@/constants/constants'
import { cn } from '@/lib/utils/cn'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'

interface CategoryFilterProps {
  headingClassName?: string
  selectedCategory?: string | null
}

export function CategoryFilter({ headingClassName, selectedCategory }: CategoryFilterProps) {
  const { searchParams, pathname, push } = useFilterNavigation()

  const handleProductCategory = (e: React.MouseEvent, category: string) => {
    e.stopPropagation() // 이벤트 버블링 방지

    // 같은 카테고리 클릭 시 선택 해제, 다른 카테고리 클릭 시 선택
    const isDeselecting = selectedCategory === category

    const params = new URLSearchParams(searchParams.toString())
    if (isDeselecting) {
      params.delete('categories') // 선택 해제 시 URL에서 제거
    } else {
      params.set('categories', category) // 선택 시 URL에 추가
    }
    push(`${pathname}?${params.toString()}`)
  }
  return (
    <div className="flex flex-col gap-2.5">
      <h2 id="category-filter-heading" className={headingClassName ?? 'heading-h4'}>
        상품 카테고리
      </h2>
      <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="category-filter-heading">
        {PRODUCT_CATEGORIES?.map((category) => (
          <Button
            key={category.code}
            type="button"
            size="sm"
            className={cn(
              'border-primary-200 cursor-pointer border px-2.5 py-0.75 text-[13px] font-normal md:font-medium',
              selectedCategory === category.code
                ? 'bg-primary-300 font-bold text-white'
                : 'hover:bg-primary-300 text-gray-900 hover:text-white'
            )}
            onClick={(e) => handleProductCategory(e, category.code)}
            aria-pressed={selectedCategory === category.code}
          >
            {category.name}
          </Button>
        ))}
      </div>
    </div>
  )
}
