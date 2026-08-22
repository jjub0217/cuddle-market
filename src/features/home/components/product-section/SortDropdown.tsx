'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { SORT_TYPE } from '@/constants/constants'
import { Z_INDEX } from '@/constants/ui'
import { cn } from '@/lib/utils/cn'

// 좁은 화면의 정렬 고르개 — 「최신순 ▾」 를 누르면 목록이 펼쳐진다.
//
// 넓은 화면은 네 개를 그대로 늘어놓는다(ProductsSection). 좁은 화면에서는 그 줄이
// 「판매중」 토글과 부딪혀 두 줄로 접혔다. 앱도 같은 자리에서 정렬을 접어 둔다
// (mobile/components/products/product-list-toolbar.tsx 의 「최신순 ▾」).
//
// ⚠️ 앱은 아래에서 올라오는 시트를 쓰지만 웹은 드롭다운이다 — 손가락이 닿는 자리가
//    다르기 때문이다. 앱은 한 손으로 들고 아래가 편하고, 웹은 눌린 단추 옆이 편하다.

interface SortDropdownProps {
  /** 지금 골라진 정렬의 이름 (예: '최신순') */
  selectedSort: string
  onSortChange: (label: string) => void
  className?: string
}

export function SortDropdown({ selectedSort, onSortChange, className }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // 바깥을 누르거나 ESC 를 누르면 닫는다.
  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setIsOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        // ⚠️ 값은 앱의 sortTrigger 를 그대로 가져왔다 — height 32 · gap 2 · paddingLeft 4 · 글자 13.
        //    **앱에는 테두리가 없다.** 웹만 알약처럼 두르면 같은 화면이 달라 보인다.
        className="flex h-8 cursor-pointer items-center gap-0.5 pl-1 text-[13px] text-gray-600"
      >
        {selectedSort}
        <ChevronDown size={16} aria-hidden="true" className={cn('transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen ? (
        <ul
          role="listbox"
          aria-label="정렬 기준"
          className={cn(
            'absolute right-0 mt-1 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg',
            Z_INDEX.DROPDOWN
          )}
        >
          {SORT_TYPE.map((sort) => {
            const isActive = selectedSort === sort.label
            return (
              <li key={sort.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onSortChange(sort.label)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left text-[13px]',
                    isActive ? 'font-bold text-primary-600' : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {sort.label}
                  {isActive ? <Check size={14} aria-hidden="true" /> : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
