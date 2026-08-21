'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { CATEGORIES } from '@/constants/map'
import { Z_INDEX } from '@/constants/ui'
import { useMapStore } from '@/store/mapStore'
import { useFocusTrap } from '@/hooks/useFocusTrap'
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
  const categoryLabel = CATEGORIES.find((c) => c.key === selectedCategory)?.label ?? selectedCategory

  // 초점 가둠(#981) — 열면 안으로 넣고, 탭을 상자 안에서 돌리고, 닫으면 열기 전 자리로 되돌린다.
  //
  // ⚠️ **상자에 tabIndex 를 주지 않는다.** 주면 훅이 상자 자신에게 초점을 주는데(훅 주석),
  //    여기서는 안의 첫 요소인 **「목록 닫기」 단추**로 들어가는 편이 낫다 —
  //    엔터 한 번으로 바로 닫을 수 있고, 세부 필터 서랍과도 같은 자리다.
  const 상자 = useFocusTrap<HTMLDivElement>(isOpen)

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
      ref={상자}
      role="dialog"
      aria-modal="true"
      aria-label={`${categoryLabel} 목록`}
      aria-hidden={!isOpen}
      className={cn(
        // ⚠️ 화면을 다 덮지 않고 **아래 절반**만 차지한다. 위쪽 지도가 보여야
        //    「어디를 보고 있는지」가 남는다(사용자 시안).
        //
        // ⚠️ **하단 탭바 위에서 멈춘다.** 예전에는 `bottom-0` 이라 탭바(높이 57)를 덮어
        //    목록을 열면 다른 탭으로 갈 길이 사라졌다(실측).
        //    ⚠️ 값은 탭바와 **같은 규칙**이어야 한다 — BottomNav 는 `h-14`(56) 에
        //       **위 테두리 1px** 과 기기 아래 안전영역(env(safe-area-inset-bottom))이 더해져
        //       실제로는 57 + 안전영역이다(실측). 셋을 그대로 더한다.
        'fixed inset-x-0 flex h-1/2 flex-col rounded-t-2xl bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out md:hidden',
        'bottom-[calc(3.5rem+1px+env(safe-area-inset-bottom))]',
        Z_INDEX.MODAL,
        // ⚠️ **닫을 때는 자기 높이 + 바닥에서 띄운 만큼**을 내려야 한다.
        //    `translate-y-full` 은 자기 높이(50%)만큼만 내리는데, 이 패널은 탭바 위에
        //    57px 떠 있어서 **그 57px 이 남아 머리글이 탭바를 덮고 있었다**(실측).
        isOpen ? 'translate-y-0' : 'translate-y-[calc(100%+3.5rem+1px+env(safe-area-inset-bottom))]'
      )}
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 px-4">
        {/* ⚠️ **개수를 안 적는다.** 데스크탑 목록에도 앱 시트에도 개수가 없다 — 여기만
            적으면 셋이 갈린다. 게다가 장소를 받기 전 첫 순간에는 0 이 잠깐 보인다. */}
        <h2 className="text-base font-bold text-gray-900">{categoryLabel}</h2>
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
