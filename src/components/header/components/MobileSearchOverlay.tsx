'use client'

import { Suspense, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Z_INDEX } from '@/constants/ui'
import { useFocusTrap } from '@/hooks/useFocusTrap'
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
 * - 열려 있는 동안 초점을 이 상자 안에 가둔다(#981)
 * - 데스크탑(`xl`)에서는 항상 숨김
 */
export default function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  // 초점 가둠(#981). `role="dialog" aria-modal="true"` 라고 알려 놓고 뒤가 만져지면 안 된다.
  //
  // ⚠️ **상자에 `tabIndex` 를 주지 않는다.** 주면 훅이 상자 자신에 초점을 주는데,
  //    검색 화면은 열자마자 바로 칠 수 있어야 하므로 초점이 검색칸에 가야 한다.
  //    tabIndex 를 안 주면 훅은 **안쪽 첫 요소**를 찾는데, 이 상자의 DOM 순서상
  //    첫 요소가 바로 그 검색칸(`#search-mobile`)이다 —
  //    SearchBar 의 돋보기 아이콘은 <div> 라 초점을 못 받고, 지우기(X) 단추는
  //    입력한 글자가 있을 때만, 그것도 <input> **뒤에** 생긴다.
  //    닫기(X) 단추는 검색칸보다 뒤에 있다.
  //    그래서 아래 「300ms 뒤 자동 포커스」와 같은 요소를 가리켜 서로 싸우지 않는다.
  const overlayRef = useFocusTrap<HTMLDivElement>(isOpen)

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
  //
  // 위 초점 가둠 훅도 열 때 같은 요소(안쪽 첫 요소 = `#search-mobile`)에 초점을 준다.
  // 그래도 이것을 남겨 둔다 — 슬라이드가 끝나는 시점(duration-300)에 맞춘 것이라
  // 실기기에서 자판이 올라오는 때가 여기에 달려 있고, jsdom 으로는 확인할 수 없다.
  // 이미 초점이 가 있으면 focus() 는 아무 일도 하지 않는다.
  useEffect(() => {
    if (!isOpen) return
    const t = window.setTimeout(() => {
      document.getElementById('search-mobile')?.focus()
    }, 300)
    return () => window.clearTimeout(t)
  }, [isOpen])

  return (
    <div
      ref={overlayRef}
      className={cn(
        // 「여기부터 데스크탑」은 lg(1024)다 — 헤더와 같은 값이어야 한다(#961).
        // 1280 으로 두면 1024~1280 에서 **데스크탑 검색칸이 있는데 이 창도 뜰 수 있다.**
        'fixed inset-0 bg-white transition-transform duration-300 ease-out lg:hidden',
        Z_INDEX.MODAL,
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
      role="dialog"
      aria-modal="true"
      aria-label="검색"
      aria-hidden={!isOpen}
      // 닫혀 있는 동안 탭 순서에서 통째로 뺀다(#999).
      // 바로 위 `aria-hidden` 은 화면낭독기에서만 감출 뿐 **초점은 못 막는다** — 둘 다 필요하다.
      // ⚠️ `visibility: hidden` 으로 막지 말 것 — 여닫는 애니메이션이 끊긴다.
      inert={!isOpen}
    >
      <div className="flex h-16 items-center gap-3 px-4 pt-3">
        <div className="flex-1">
          <Suspense>
            <SearchBar
              id="search-mobile"
              className="h-10"
              inputClass="py-1 text-[15px] bg-white"
              wrapperClassName="rounded-full bg-white border border-outline-variant"
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
