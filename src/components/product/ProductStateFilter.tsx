'use client'

import { useState } from 'react'
import { CONDITION_ITEMS } from '@/constants/constants'
import { cn } from '@/lib/utils/cn'
import { useFilterNavigation } from '@/hooks/useFilterNavigation'
import { CARD_CHIP_STYLES } from './filterChipStyles'

type ProductStateFilterVariant = 'default' | 'card-chip' | 'pill'

interface ProductStateFilterProps {
  headingClassName?: string
  inputClassname?: string
  labelClassname?: string
  subTitle?: boolean
  selectedProductStatus?: string | null
  onProductStatusChange?: (status: string | null) => void
  useUrlSync?: boolean // true: URL 동기화 (DetailFilter용), false: 로컬 state (ProductPostForm용)
  variant?: ProductStateFilterVariant
}

const VARIANT_STYLES: Record<
  ProductStateFilterVariant,
  { container: string; label: string; activeLabel: string; inactiveLabel: string }
> = {
  default: {
    container: 'grid grid-cols-2 flex-wrap gap-2.5 md:flex',
    label:
      'flex cursor-pointer flex-col gap-1 rounded-lg bg-primary-50 px-4 py-2 text-center text-xs font-medium md:text-sm',
    activeLabel: 'bg-primary-300 text-on-surface',
    inactiveLabel: 'text-gray-900 hover:bg-primary-300 hover:text-on-surface',
  },
  'card-chip': {
    container: CARD_CHIP_STYLES.container,
    label: CARD_CHIP_STYLES.chip,
    activeLabel: CARD_CHIP_STYLES.chipActive,
    inactiveLabel: CARD_CHIP_STYLES.chipInactive,
  },
  pill: {
    container: 'flex flex-wrap gap-2',
    label:
      'inline-block cursor-pointer rounded-full px-4 py-2 text-xs font-bold transition-colors',
    activeLabel: 'bg-primary-container text-on-primary-container border border-transparent',
    inactiveLabel:
      'border border-outline-variant text-on-surface-muted hover:bg-surface-container-low',
  },
}

export function ProductStateFilter({
  headingClassName,
  inputClassname,
  labelClassname,
  subTitle,
  selectedProductStatus: externalSelectedStatus,
  onProductStatusChange,
  useUrlSync = false,
  variant = 'default',
}: ProductStateFilterProps) {
  const { searchParams, pathname, push } = useFilterNavigation()
  const [internalSelectedStatus, setInternalSelectedStatus] = useState<string | null>(null)

  // 외부에서 전달된 값이 있으면 사용, 없으면 내부 state 사용
  const selectedProductStatus =
    externalSelectedStatus !== undefined ? externalSelectedStatus : internalSelectedStatus

  const handleStatusChange = (value: string) => {
    // card-chip variant은 토글 동작 (다시 클릭 시 해제), default는 단방향 선택
    const nextValue = variant === 'card-chip' && selectedProductStatus === value ? null : value

    // URL 동기화 모드일 때만 URL 업데이트
    if (useUrlSync) {
      const params = new URLSearchParams(searchParams.toString())
      if (nextValue === null) {
        params.delete('productStatuses')
      } else {
        params.set('productStatuses', nextValue)
      }
      push(`${pathname}?${params.toString()}`)
    }

    if (onProductStatusChange) {
      onProductStatusChange(nextValue)
    } else {
      setInternalSelectedStatus(nextValue)
    }
  }

  const styles = VARIANT_STYLES[variant]

  return (
    <div className="flex flex-col gap-2">
      {useUrlSync ? (
        <h4 id="condition-filter-heading" className={headingClassName ?? 'heading-h5'}>
          상품 상태
        </h4>
      ) : (
        <span id="condition-filter-heading" className={cn(labelClassname ?? 'heading-h5', 'text-gray-900')}>
          상품 상태 <span className="text-red-500">*</span>
        </span>
      )}
      <div className={styles.container} role="radiogroup" aria-labelledby="condition-filter-heading">
        {CONDITION_ITEMS.map((item) => {
          const isActive = selectedProductStatus === item.value
          return (
            <div key={item.value} className={inputClassname}>
              <input
                type="radio"
                id={`productStatus-${item.value}`}
                name="productStatus"
                value={item.value}
                checked={isActive}
                onChange={() => handleStatusChange(item.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={`productStatus-${item.value}`}
                className={cn(styles.label, isActive ? styles.activeLabel : styles.inactiveLabel)}
              >
                <span>{item.title}</span>
                {subTitle && variant === 'default' ? (
                  <span className="text-xs font-medium">{item.subtitle}</span>
                ) : null}
              </label>
            </div>
          )
        })}
      </div>
    </div>
  )
}
