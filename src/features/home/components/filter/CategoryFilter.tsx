'use client'

import Button from '@/components/commons/button/Button'
import { PRODUCT_CATEGORIES } from '@/constants/constants'
import { cn } from '@/lib/utils/cn'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

interface CategoryFilterProps {
  headingClassName?: string
  selectedCategory?: string | null
  onCategoryChange?: (category: string | null) => void
}

export function CategoryFilter({ headingClassName, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

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
    router.push(`${pathname}?${params.toString()}`)

    onCategoryChange?.(isDeselecting ? null : category)
  }
  return (
    <div className="flex flex-col gap-2.5">
      <span id="category-filter-heading" className={cn('heading-h4', headingClassName)}>
        상품 카테고리
      </span>
      <div className="flex flex-wrap gap-2.5" role="group" aria-labelledby="category-filter-heading">
        {PRODUCT_CATEGORIES?.map((category) => (
          <Button
            key={category.code}
            type="button"
            size="sm"
            className={cn(
              'border-primary-200 cursor-pointer border',
              selectedCategory === category.code ? 'bg-primary-300 font-bold text-white' : 'hover:bg-primary-300 text-gray-900 hover:text-white',
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
