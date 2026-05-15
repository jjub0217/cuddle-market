'use client'

import Button from '@/components/commons/button/Button'
import { PRICE_TYPE, type PriceRange } from '@/constants/constants'
import { cn } from '@/lib/utils/cn'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import { CARD_CHIP_STYLES } from '@/components/product/filterChipStyles'

type PriceFilterVariant = 'default' | 'card-chip'

interface PriceFilterProps {
  headingClassName?: string
  selectedPriceRange?: PriceRange | null
  variant?: PriceFilterVariant
}

const VARIANT_STYLES: Record<
  PriceFilterVariant,
  { container: string; chipBase: string; activeChip: string; inactiveChip: string }
> = {
  default: {
    container: 'gap-sm grid grid-cols-2 flex-wrap md:flex',
    chipBase: 'bg-primary-50 cursor-pointer text-xs md:text-sm font-medium',
    activeChip: 'bg-primary-300 font-bold text-on-surface',
    inactiveChip: 'text-gray-900 hover:bg-primary-300 hover:text-on-surface',
  },
  'card-chip': {
    container: CARD_CHIP_STYLES.container,
    chipBase: CARD_CHIP_STYLES.chip,
    activeChip: CARD_CHIP_STYLES.chipActive,
    inactiveChip: CARD_CHIP_STYLES.chipInactive,
  },
}

export function PriceFilter({ headingClassName, selectedPriceRange, variant = 'default' }: PriceFilterProps) {
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

  const styles = VARIANT_STYLES[variant]

  return (
    <div className="flex flex-col gap-2 max-md:gap-0">
      <h4 id="price-filter-heading" className={headingClassName ?? 'heading-h4'}>
        가격대
      </h4>
      <div className={styles.container} role="group" aria-labelledby="price-filter-heading">
        {PRICE_TYPE.map((item) => {
          const isActive =
            selectedPriceRange?.min === item.value.min && selectedPriceRange?.max === item.value.max
          return (
            <Button
              key={`${item.value.min}-${item.value.max}`}
              type="button"
              size="sm"
              className={cn(styles.chipBase, isActive ? styles.activeChip : styles.inactiveChip)}
              onClick={(e) => handleMinPrice(e, item.value)}
              aria-pressed={isActive}
            >
              {item.title}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
