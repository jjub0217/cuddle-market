'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { CATEGORIES } from '@/constants/map'
import { Z_INDEX } from '@/constants/ui'
import { useMapStore } from '@/store/mapStore'
import { cn } from '@/lib/utils/cn'
import { PlaceList } from './PlaceList'

// 좁은 화면의 장소 목록 — 「목록 보기」를 누르면 아래에서 올라와 화면을 덮는다.
//
// ⚠️ **왜 만드나:** 폰으로 웹에 온 사람만 목록을 못 봤다(#976). 데스크탑에는 왼쪽 붙박이
//    목록이, 앱에는 끌어올리는 시트가 있는데 모바일 웹만 **마커를 하나씩 눌러야** 했다.
//
// ⚠️ **앱처럼 끌어올리는 시트가 아니다.** 시트는 제스처·애니메이션 함정이 많아
//    (앱 place-sheet.tsx 주석 참고) 먼저 **단추로 여는 전체 화면**으로 만들었다.
//    없는 것보다 낫고, 나중에 시트로 올릴 수 있다.
//
// ⚠️ **줄 모양은 여기 없다.** `PlaceList` 를 데스크탑 목록과 함께 쓴다 — 두 벌로 만들면
//    한쪽만 고쳐져 갈린다.

interface MobilePlaceListOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobilePlaceListOverlay({ isOpen, onClose }: MobilePlaceListOverlayProps) {
  const selectedCategory = useMapStore((s) => s.selectedCategory)
  const markers = useMapStore((s) => s.markers)
  const categoryLabel = CATEGORIES.find((c) => c.key === selectedCategory)?.label ?? selectedCategory

  // ESC 로 닫기
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${categoryLabel} 목록`}
      aria-hidden={!isOpen}
      className={cn(
        'fixed inset-0 flex flex-col bg-white transition-transform duration-300 ease-out md:hidden',
        Z_INDEX.MODAL,
        isOpen ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        <h2 className="text-base font-bold text-gray-900">
          {categoryLabel}
          <span className="ml-1.5 text-sm font-normal text-gray-500">{markers.length}</span>
        </h2>
        <button type="button" aria-label="목록 닫기" onClick={onClose} className="cursor-pointer p-1">
          <X size={20} className="text-gray-600" />
        </button>
      </header>

      {/* ⚠️ 본문만 구르게 둔다(min-h-0). 머리글은 위에 남아야 한다 */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <PlaceList onSelect={onClose} />
      </div>
    </div>
  )
}
