'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import { useFocusTrap } from '@/hooks/useFocusTrap'
import { cn } from '@/lib/utils/cn'
import { OVERLAY_ABOVE_ATTR, Z_INDEX } from '@/constants/ui'

// 아래에서 올라오는 시트. 좁은 폭에서 목록 항목의 ⋮ 메뉴로 쓴다.
//
// 왜 가운데 모달이 아닌가:
// 목록 항목마다 뜨는 메뉴라 한 손으로 닿는 아래쪽이 맞고, 위험한 항목(삭제)을
// 화면 한가운데가 아니라 아래로 떨어뜨려 둘 수 있다.
// 앱도 같은 판단을 했다(mobile/components/ui/bottom-sheet.tsx).
//
// 왜 <dialog>를 안 쓰나:
// 이 저장소의 모달 12개는 <dialog showModal()>인데, 그건 top-layer에 그려져서
// 안에서 연 드롭다운이 뒤로 숨는 문제를 만든다(#788의 SelectDropdown 건).
// 시트는 그럴 일이 없게 평범한 portal + fixed로 둔다.
//
// 취소 버튼은 없다. 바깥을 누르거나 ESC로 닫는다 — 앱·당근과 같다.

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  /** 화면 낭독기가 읽을 이름 */
  label: string
}

const ANIMATION_MS = 200

export function BottomSheet({ isOpen, onClose, children, label }: BottomSheetProps) {
  // 초점 넣기·가두기·되돌리기는 훅이 다 한다(#981).
  //
  // ⚠️ 가두는 상자는 **덮개까지 감싼 바깥이 아니라 시트 판**이다.
  //    `aria-modal="true"` 를 붙여 둔 곳이 시트 판이므로, 낭독기에 「여기만 쓴다」고
  //    알린 경계와 초점이 도는 경계를 같게 맞춘다. 그래서 덮개의 「닫기」 단추는
  //    탭으로 못 닿는다 — 대신 ESC 와 덮개 누르기로 닫는다(원래 그렇게 만든 시트다).
  //    바깥까지 감싸면 열자마자 초점이 「닫기」에 앉아, 항목부터 고르게 하려던
  //    아래 원래 뜻(첫 항목으로 옮기기)이 뒤집힌다.
  const sheetRef = useFocusTrap<HTMLDivElement>(isOpen)

  // 서버에서는 document가 없다. 붙은 뒤에만 portal한다.
  //
  // useEffect로 setState하지 않는다 — 그러면 한 번 그린 뒤 또 그린다(#788에서 없앤 패턴).
  // useSyncExternalStore는 서버에서 두 번째 함수를, 브라우저에서 첫 번째 함수를 쓴다.
  // 즉 「지금 브라우저인가」를 다시 그리지 않고 알 수 있다.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // ESC로 닫기 + 뒤 화면 스크롤 잠그기
  // (포커스 옮기기·가두기·되돌리기는 위 useFocusTrap이 맡는다)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    // 시트를 열어 둔 채 뒤가 스크롤되면 어디를 보고 있는지 잃는다
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen, onClose])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      // 이 시트가 열려 있는 동안에는 아래쪽 오버레이가 ESC 를 먹지 않게 한다(#1003).
      // 자세한 까닭은 `OVERLAY_ABOVE_ATTR` 주석에 있다.
      {...{ [OVERLAY_ABOVE_ATTR]: '' }}
      className={cn('fixed inset-0', Z_INDEX.MODAL)}
      // ⚠️ portal은 DOM에서만 body로 나간다. React 이벤트는 **여전히 React 트리를 따라**
      //    올라간다. 이 시트는 카드 전체를 감싼 <Link> 안에서 열리므로, 막지 않으면
      //    덮개를 눌렀을 때 링크가 눌린 셈이 되어 상세 페이지로 넘어간다.
      //    (실기기에서 실제로 그랬다 — #793)
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onMouseDown={(e) => e.stopPropagation()}
      // ⚠️ 키 이벤트는 막지 않는다. 막으면 ESC가 document까지 못 올라가 시트가 안 닫힌다.
      //    (한 번 막았다가 시험이 잡았다.)
      //    링크는 눌림(click)으로만 따라가므로 위 onClick만으로 충분하다.
    >
      {/* 덮개. 눌러서 닫는다 */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={{ animationDuration: `${ANIMATION_MS}ms` }}
        className="bottom-sheet__panel absolute right-0 bottom-0 left-0 rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)]"
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

/** 시트 안의 한 줄. 앱 sheetItemStyles와 같은 결이다 */
export function BottomSheetItem({
  onClick,
  tone = 'default',
  children,
}: {
  onClick: (e: React.MouseEvent) => void
  /** danger는 되돌리기 어려운 것(삭제)에만 */
  tone?: 'default' | 'danger'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // 가운데 정렬. 항목 글자 길이가 제각각이라(「삭제」 ~ 「판매중으로 바꾸기」)
        // 한쪽에 붙이면 줄마다 끝이 들쭉날쭉해 보인다.
        'border-outline-variant/40 flex w-full cursor-pointer items-center justify-center gap-3 border-b px-5 py-4 text-center text-[15px] transition-colors last:border-b-0 hover:bg-gray-50 active:bg-gray-100',
        tone === 'danger' ? 'text-danger-500' : 'text-gray-900'
      )}
    >
      {children}
    </button>
  )
}
