'use client'

import { Suspense, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Z_INDEX } from '@/constants/ui'
import SearchBar from './SearchBar'

interface MobileSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 모바일 전용 풀스크린 검색 오버레이.
 *
 * - 우측에서 좌측으로 슬라이드 인 (`translate-x-full` → `translate-x-0`)
 * - 검색 실행(Enter) 또는 닫기 버튼/ESC로 닫힘
 * - 열렸을 때 body 스크롤 잠금 + 검색 input 자동 포커스
 * - 데스크탑(`xl`)에서는 항상 숨김
 */
export default function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // 열림 동안 body 스크롤 잠금
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // 슬라이드 인 끝난 뒤 input 자동 포커스
  useEffect(() => {
    if (!isOpen) return
    const t = window.setTimeout(() => {
      document.getElementById('search-mobile')?.focus()
    }, 300)
    return () => window.clearTimeout(t)
  }, [isOpen])

  return (
    <div
      className={cn(
        'fixed inset-0 bg-white transition-transform duration-300 ease-out xl:hidden',
        Z_INDEX.MODAL,
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="검색"
      aria-hidden={!isOpen}
    >
      <div className="flex h-16 items-center gap-3 px-4 pt-3">
        <div className="flex-1">
          <Suspense>
            <SearchBar
              id="search-mobile"
              className="h-10"
              inputClass="py-1 text-[15px] bg-white"
              wrapperClassName="rounded-full bg-white border border-[#d4c4b2]"
              onSearch={onClose}
            />
          </Suspense>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="검색 닫기"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  )
}
