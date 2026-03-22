'use client'

import Button from '@/components/commons/button/Button'
import { PRICE_TYPE, type PriceRange } from '@/constants/constants'
import { cn } from '@/lib/utils/cn'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'

interface PriceFilterProps {
  headingClassName?: string
  selectedPriceRange?: PriceRange | null
}

export function PriceFilter({ headingClassName, selectedPriceRange }: PriceFilterProps) {
  const { searchParams, pathname, push } = useFilterNavigation()

  const handleMinPrice = (e: React.MouseEvent, priceRange: PriceRange) => {
    e.stopPropagation() // 이벤트 버블링 방지

    // 같은 가격대 클릭 시 선택 해제, 다른 가격대 클릭 시 선택
    const isDeselecting = selectedPriceRange?.min === priceRange.min && selectedPriceRange?.max === priceRange.max

    const params = new URLSearchParams(searchParams.toString())
    if (isDeselecting) {
      params.delete('minPrice')
      params.delete('maxPrice')
    } else {
      params.set('minPrice', priceRange.min.toString())
      if (priceRange.max !== null) {
        params.set('maxPrice', priceRange.max.toString())
      } else {
        params.delete('maxPrice')
      }
    }
    push(`${pathname}?${params.toString()}`)
  }
  return (
    <div className="flex flex-col gap-2">
      <h4 id="price-filter-heading" className={headingClassName ?? 'heading-h4'}>
        가격대
      </h4>
      <div className="gap-sm grid grid-cols-2 flex-wrap md:flex" role="group" aria-labelledby="price-filter-heading">
        {PRICE_TYPE.map((item) => (
          <Button
            key={`${item.value.min}-${item.value.max}`}
            type="button"
            size="sm"
            className={cn(
              'bg-primary-50 cursor-pointer text-xs md:text-sm font-medium',
              selectedPriceRange?.min === item.value.min && selectedPriceRange?.max === item.value.max
                ? 'bg-primary-300 font-bold text-white'
                : 'hover:bg-primary-300 text-gray-900 hover:text-white'
            )}
            onClick={(e) => handleMinPrice(e, item.value)}
            aria-pressed={selectedPriceRange?.min === item.value.min && selectedPriceRange?.max === item.value.max}
          >
            {item.title}
          </Button>
        ))}
      </div>
    </div>
  )
}
