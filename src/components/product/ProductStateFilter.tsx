'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { CONDITION_ITEMS } from '@/constants/constants'
import { cn } from '@/lib/utils/cn'
import { RequiredLabel } from '@/components/commons/RequiredLabel'

interface ProductStateFilterProps {
  headingClassName?: string
  inputClassname?: string
  labelClassname?: string
  subTitle?: boolean
  selectedProductStatus?: string | null
  onProductStatusChange?: (status: string | null) => void
  useUrlSync?: boolean // true: URL 동기화 (DetailFilter용), false: 로컬 state (ProductPostForm용)
}

export function ProductStateFilter({
  headingClassName,
  inputClassname,
  labelClassname,
  subTitle,
  selectedProductStatus: externalSelectedStatus,
  onProductStatusChange,
  useUrlSync = false,
}: ProductStateFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [internalSelectedStatus, setInternalSelectedStatus] = useState<string | null>(null)

  // 외부에서 전달된 값이 있으면 사용, 없으면 내부 state 사용
  const selectedProductStatus = externalSelectedStatus !== undefined ? externalSelectedStatus : internalSelectedStatus

  const handleStatusChange = (value: string) => {
    const isDeselecting = selectedProductStatus === value
    const newValue = isDeselecting ? null : value

    // URL 동기화 모드일 때만 URL 업데이트
    if (useUrlSync) {
      const params = new URLSearchParams(searchParams.toString())
      if (isDeselecting) {
        params.delete('productStatuses')
      } else {
        params.set('productStatuses', value)
      }
      router.push(`${pathname}?${params.toString()}`)
    }

    // 외부 콜백이 있으면 호출, 없으면 내부 state 업데이트
    if (onProductStatusChange) {
      onProductStatusChange(newValue)
    } else {
      setInternalSelectedStatus(newValue)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {useUrlSync ? (
        <span id="condition-filter-heading" className={cn('heading-h5', headingClassName)}>
          상품 상태
        </span>
      ) : (
        <RequiredLabel htmlFor="signup-name" labelClass="heading-h5">
          상품 상태
        </RequiredLabel>
      )}
      <div className={cn('grid grid-cols-2 flex-wrap gap-2.5 md:flex')} role="radiogroup" aria-labelledby="condition-filter-heading">
        {CONDITION_ITEMS.map((item) => (
          <div key={item.value} className={inputClassname}>
            <input
              type="radio"
              id={`productStatus-${item.value}`}
              name="productStatus"
              value={item.value}
              checked={selectedProductStatus === item.value}
              onChange={() => handleStatusChange(item.value)}
              className={cn('peer sr-only')}
            />
            <label
              htmlFor={`productStatus-${item.value}`}
              className={cn(
                'flex cursor-pointer flex-col gap-1 rounded-lg px-4 py-2 text-center',
                'bg-primary-50 text-sm font-medium',
                labelClassname,
                selectedProductStatus === item.value ? 'bg-primary-300 text-white' : 'hover:bg-primary-300 text-gray-900 hover:text-white'
              )}
            >
              <span>{item.title}</span>
              {subTitle && <span className="text-xs font-medium">{item.subtitle}</span>}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
