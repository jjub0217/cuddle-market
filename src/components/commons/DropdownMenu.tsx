'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

import { OVERLAY_ABOVE_ATTR, Z_INDEX } from '@/constants/ui'
import { useOutsideClick } from '@/hooks/useOutsideClick'
import { cn } from '@/lib/utils/cn'

// 단추에 붙는 더보기 메뉴. 「이 항목에 대한 할 일」을 고르는 자리다.
//
// 왜 아래에서 올라오는 시트가 아닌가:
// 모바일 웹은 모바일 앱이 아니라 **데스크탑 웹의 반응형**이다. 시트는 앱에 맞는 모양이고,
// 웹에서 이 성격의 메뉴는 단추에 붙는 드롭다운이 맞다(#1030).
// (지도의 시트 둘은 「목록·상세」라는 **화면**이라 다른 물건이다. 그건 그대로 둔다.)
//
// 왜 portal 로 body 에 내보내나 — 두 가지 때문이다:
//   1) **잘림.** 이 메뉴가 뜨는 자리는 스크롤 상자 안이다
//      (MyPagePanel 의 `max-h-[60vh] overflow-y-auto` · MyPage 모바일 패널의 `overflow-y-auto`).
//      `absolute` 로 두면 마지막 카드의 메뉴가 통째로 잘린다.
//   2) **`fixed` 의 기준점.** 감싼 <Link> 에 `hover:-translate-y-1` 이 있어 마우스를 올리면
//      transform 이 생기고, **transform 이 걸린 조상은 fixed 의 기준점이 된다.**
//      그 안에 두면 마우스를 올렸다 뗄 때마다 메뉴가 튄다.

interface DropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  /** 이 단추 아래에 붙는다. 닫을 때 초점도 여기로 되돌린다 */
  triggerRef: React.RefObject<HTMLElement | null>
  /** 화면 낭독기가 읽을 이름 */
  label: string
  children: React.ReactNode
}

/** 단추와 메뉴 사이 틈 */
const GAP_PX = 4
/** 화면 가장자리에 딱 붙지 않게 두는 여유 */
const EDGE_MARGIN_PX = 8

/** 자리 하나 — 위/아래 중 고른 쪽만 값이 있다. `right` 정렬은 늘 같이 잰다 */
type MenuStyle = { top: number; right: number; maxHeight: number } | { bottom: number; right: number; maxHeight: number }

/** 단추 기준으로 위·아래에 각각 얼마나 자리가 남는지 (음수면 모자란다는 뜻) */
function getSpace(rect: DOMRect) {
  return {
    below: window.innerHeight - rect.bottom - GAP_PX - EDGE_MARGIN_PX,
    above: rect.top - GAP_PX - EDGE_MARGIN_PX,
  }
}

/** 고른 방향으로 실제 자리(top/bottom·right·maxHeight)를 만든다. maxHeight 는 절대 음수를 안 준다 —
 *  음수 max-height 는 CSS 에서 무효라 아예 안 먹혀서, 모자란 자리 그대로 아무 제한 없이 튀어나간다. */
function computeMenuStyle(rect: DOMRect, placement: 'below' | 'above'): MenuStyle {
  const right = window.innerWidth - rect.right
  const { below, above } = getSpace(rect)
  if (placement === 'above') {
    return { bottom: window.innerHeight - rect.top + GAP_PX, right, maxHeight: Math.max(above, 0) }
  }
  return { top: rect.bottom + GAP_PX, right, maxHeight: Math.max(below, 0) }
}

export function DropdownMenu({ isOpen, onClose, triggerRef, label, children }: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<MenuStyle | null>(null)
  // ② 두 번 그리기 중 「아직 안 보여줘도 되나」 — 방향을 정하기 전까지는 false.
  const [visible, setVisible] = useState(false)
  // 이번에 열린 동안 고른 방향. 스크롤 중에는 안 바뀐다 — 열 때 한 번만 정한다(아래 useLayoutEffect).
  const placementRef = useRef<'below' | 'above'>('below')

  // 서버에는 document 가 없다. 붙은 뒤에만 portal 한다.
  // useEffect + setState 로 하면 한 번 그린 뒤 또 그린다(#788 에서 없앤 패턴).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // 바깥 누르기와 ESC 를 한 훅이 맡는다(ProfileData·ChatRoomInfo 와 같은 훅).
  //
  // ⚠️ **ESC 는 버블로 듣는다.** 이 훅이 `document.addEventListener('keydown', …)` 를
  //    세 번째 인자 없이 단다. 마이페이지 패널은 **캡처**로 듣는데(MyPage.tsx:479),
  //    캡처끼리 붙으면 차례가 뒤집혀 패널이 먼저 닫힌다.
  // ⚠️ **여기서 preventDefault() 로 「내가 먹었다」를 표시하지 않는다.** 그러면 이 위에
  //    열린 네이티브 <dialog> 가 ESC 로 안 닫힌다(constants/ui.ts 의 OVERLAY_ABOVE_ATTR 주석).
  const refs = useMemo(() => [triggerRef, menuRef], [triggerRef])
  useOutsideClick(isOpen, refs, onClose)

  // 열릴 때마다 「아직 안 보인다」 상태로 새로 시작한다.
  //
  // ⚠️ useEffect 에 두면 react-hooks/set-state-in-effect 가 막는다(게이트 실패) — 이 저장소는
  //    렌더 도중에 맞추는 방식을 쓴다(PhotoViewer.tsx:150-165, useFavorite.ts:27-31 과 같다).
  //    「이전 값을 기억해 두고 달라졌을 때만」이 핵심이다 — 그냥 대입하면 스크롤로 position 이
  //    새로 잡힐 때마다(아래 effect) 이 렌더도 매번 다시 돌아 무한히 반복된다.
  // ⚠️ placementRef 는 여기서 안 건드린다 — ref는 렌더 도중 손대면 안 되고(react-hooks/refs),
  //    ref는 setState 와 달리 effect 안에서 만져도 되는 값이라 아래 effect 쪽에 남겨 뒀다.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen)
    if (isOpen) setVisible(false)
  }

  // 단추 자리에 맞춘다. 오른쪽 정렬이라 left 가 아니라 right 로 잰다.
  // 스크롤·크기바뀜에 따라 다시 잰다(SelectDropdown 과 같은 방식) — 단, **방향(위/아래)은 안 다시
  // 정한다.** placementRef 는 열 때(여기서) 한 번만 「아래로」 리셋되고, 그 뒤로는 아래
  // useLayoutEffect 가 딱 한 번만 바꾼다. 여기서는 그 방향을 유지한 채 단추를 계속 따라가기만 한다.
  useEffect(() => {
    if (!isOpen) return
    placementRef.current = 'below'

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      setPosition(computeMenuStyle(trigger.getBoundingClientRect(), placementRef.current))
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    // 세 번째 인자 true — 안쪽 스크롤 상자가 움직여도 따라간다
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, triggerRef])

  // ② 방향을 딱 한 번 정한다 — 위 effect 가 일단 「아래로」 그려 둔 것을 재서 판단한다.
  //
  //   1) 위 effect 가 이미 「아래로」 그렸다 — 단 visible 이 아직 false 라 안 보인다(아래 JSX 의
  //      opacity-0 pointer-events-none)
  //   2) 여기서 menuRef 의 실제 높이(scrollHeight)를 잰다 — 그려져야만 알 수 있는 값이다
  //   3) 아래 자리에 다 안 들어가고 & 위가 더 넓으면 → 방향을 뒤집고 위 기준으로 다시 잰다
  //   4) 마지막으로 visible 을 true 로 켠다
  //
  // ⚠️ **useLayoutEffect 를 쓰는 까닭.** useEffect 는 브라우저가 그린 뒤에 돈다 — 그 사이에
  //    「아래로 그린 모습」이 화면에 한 프레임 노출될 수 있다(안 보이게 해 뒀어도 그 자체가 위험).
  //    useLayoutEffect 는 브라우저가 그리기 **전에** 동기로 돌아, 여기서 setPosition·setVisible 을
  //    부르면 리액트가 그 결과까지 반영한 뒤에야 브라우저에 넘긴다 — 최종 자리만 한 번에 보인다.
  // ⚠️ position 을 의존성에 넣지만, **visible 이 true 가 되면 곧바로 빠져나간다.** 그래서 스크롤 중
  //    updatePosition 이 position 을 계속 바꿔도(위 effect) 여기서 다시 방향을 재지는 않는다.
  useLayoutEffect(() => {
    if (!isOpen || !position || visible) return
    const trigger = triggerRef.current
    const menu = menuRef.current
    if (!trigger || !menu) return

    const rect = trigger.getBoundingClientRect()
    const { below, above } = getSpace(rect)
    const menuHeight = menu.scrollHeight

    if (menuHeight > below && above > below) {
      placementRef.current = 'above'
      setPosition(computeMenuStyle(rect, 'above'))
    }
    setVisible(true)
  }, [isOpen, position, visible, triggerRef])

  // 닫을 때 초점을 열기 전 자리(⋮ 단추)로 되돌린다(#981).
  // 시트의 useFocusTrap 이 해 주던 일인데, 드롭다운은 모달이 아니라 가둠은 안 쓴다.
  //
  // ⚠️ **이 되돌리기가 실제로 보이는 것은 ESC·바깥 누르기로 닫을 때다.**
  //    Tab 으로 닫을 때는 초점이 다른 데로 간다 — 까닭은 아래 onKeyDown 주석에 있다.
  //
  // 닫힐 때 position 도 함께 비운다. 안 비우면 두 번째로 열 때 옛 좌표로 먼저 그렸다가
  // useEffect 가 새 자리로 고치는 한 프레임짜리 튐이 생긴다 — 아래 「자리를 알기 전에는
  // 안 그린다」 약속이 첫 열림에만 지켜지고 있었다.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !isOpen) {
      triggerRef.current?.focus()
      setPosition(null)
      setVisible(false)
    }
    wasOpen.current = isOpen
  }, [isOpen, triggerRef])

  // 열릴 때 메뉴 안 첫 항목으로 초점을 넣는다(#981). 옛 시트는 useFocusTrap 이 이걸 해 줬는데
  // 드롭다운은 body 로 portal 되어 마이페이지 패널의 focus trap 고리 밖에 있다 — 넣어 주지
  // 않으면 Tab 을 눌러도 메뉴로 못 들어간다.
  //
  // ⚠️ position 이 아니라 **visible 을 의존성으로 본다.** position 은 방향이 정해지기 전(아래로
  //    임시로 그린 첫 프레임)에도 값이 있어서, 그걸 기준으로 삼으면 뒤집히기 **전** 자리에 초점이
  //    들어가 버린다 — 초점 이동은 스크롤을 일으키므로 자리가 확정된 뒤에야 넣어야 깜빡임과 안 겹친다.
  //    「이미 넣었다」는 별도 ref 로 기억해 한 번만 한다 — 안 그러면 스크롤할 때마다 초점이 튄다.
  const focusedOnOpenRef = useRef(false)
  useEffect(() => {
    if (!isOpen) {
      focusedOnOpenRef.current = false
      return
    }
    if (focusedOnOpenRef.current || !visible) return
    const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
    if (!firstItem) return
    firstItem.focus()
    focusedOnOpenRef.current = true
  }, [isOpen, visible])

  // ⚠️ **자리를 알기 전에는 안 그린다.** 먼저 그렸다가 옮기면 한 프레임 동안 엉뚱한 데
  //    나타났다 튄다. 위 useEffect 가 붙은 직후 자리를 잡아 주므로 곧바로 다시 그린다.
  //    (jsdom 에서는 getBoundingClientRect 가 0 을 주지만 null 은 아니라 시험은 정상으로 돈다.)
  if (!mounted || !isOpen || !position) return null

  return createPortal(
    <div
      // ⚠️ **감싸개에도 z 를 준다.** position 이 있고 z-index 가 auto 면 이 감싸개가
      //    「z-index 0」 자리에 놓여, 안쪽이 아무리 큰 z 를 가져도 못 벗어난다.
      //    z-1 상품 카드가 목록을 덮은 적이 있다(#869).
      //
      // MODAL(z-[100]) 을 쓰는 까닭: 마이페이지 모바일 패널도 같은 값이다. 값이 같으면
      // body 에 나중에 붙은 쪽이 이기고, portal 인 이쪽이 나중이다. 시트가 쓰던 방법 그대로다.
      //
      // ⚠️ **방향이 정해지기 전(visible === false)에는 opacity-0 + pointer-events-none 로 숨긴다.**
      //    display:none·visibility:hidden 은 쓰지 않는다 — 그러면 menuRef 의 높이를 못 재고(화면 밖
      //    버그의 원인이었던 것과 같은 문제), 첫 항목 초점(위 focusedOnOpenRef 효과)도 안 먹는다.
      className={cn('fixed', Z_INDEX.MODAL, !visible && 'pointer-events-none opacity-0')}
      style={{ right: position.right, ...('top' in position ? { top: position.top } : { bottom: position.bottom }) }}
      // 이 메뉴가 열려 있는 동안에는 아래쪽 오버레이가 ESC 를 먹지 않게 한다(#1003).
      {...{ [OVERLAY_ABOVE_ATTR]: '' }}
      // ⚠️ portal 은 DOM 에서만 body 로 나간다. 리액트 사건은 **여전히 리액트 트리를 따라**
      //    올라간다. 이 메뉴는 카드 전체를 감싼 <Link> 안에서 열리므로, 막지 않으면
      //    눌렀을 때 링크가 눌린 셈이 되어 상세 페이지로 넘어간다(#793).
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
      }}
      onMouseDown={(e) => e.stopPropagation()}
      // ⚠️ 키 이벤트는 막지 않는다. 막으면 ESC 가 document 까지 못 올라가 안 닫힌다.
      //
      // Tab 은 WAI-ARIA menu button 패턴대로 메뉴를 닫는다(#981). preventDefault·stopPropagation
      // 은 쓰지 않는다 — onClose() 만 부르고 브라우저 기본 동작(초점 이동)은 그대로 흘려보낸다.
      //
      // 닫힌 뒤 초점이 어디로 가는지 — 2026-08-23 에 진짜 크롬으로 쟀다:
      //
      //   ESC 로 닫으면    ⋮ 단추로 돌아온다 (위 「닫을 때 되돌린다」 효과)
      //   Tab 으로 닫으면   마이페이지 패널의 「닫기」 단추로 간다.
      //                    그 패널은 useFocusTrap(MyPage.tsx:90)이 걸린 상자라,
      //                    메뉴가 떨어져 나가면 초점을 패널 안 첫 요소로 끌어간다
      //
      // 표준(단추 다음 요소로)과는 다르지만, 메뉴는 확실히 닫히고 초점도 패널 안에 남아
      // 길을 잃지 않는다. 억지로 ⋮ 로 되돌리려 하면 패널의 focus trap 과 싸우게 된다.
      //
      // ⚠️ 이 차이는 jsdom 시험으로 못 본다 — 배치도 focus trap 도 없다.
      onKeyDown={(e) => {
        if (e.key === 'Tab') onClose()
      }}
    >
      <div
        ref={menuRef}
        role="menu"
        aria-label={label}
        // ① 안전망 — maxHeight 를 늘 준다. 남는 자리보다 항목이 많으면 화면 밖으로 새는 대신
        //    **여기 안에서** 스크롤된다(overflow-y-auto). overflow-hidden 이었을 때도 rounded 모서리를
        //    지키려던 것뿐이라, auto 로 바꿔도 넘치지 않을 땐 그대로 잘려 보인다 — 스크롤바만 필요할 때 붙는다.
        style={{ maxHeight: position.maxHeight }}
        className="border-outline-variant/60 flex min-w-40 flex-col overflow-y-auto rounded-lg border bg-white shadow-md"
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

/** 메뉴 안의 한 줄 */
export function DropdownMenuItem({
  onClick,
  tone = 'default',
  children,
}: {
  onClick: (e: React.MouseEvent) => void
  /** danger 는 되돌리기 어려운 것(삭제)에만 */
  tone?: 'default' | 'danger'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        // ⚠️ **왼쪽 정렬이다.** 시트가 가운데였던 까닭은 「바닥 시트라 줄 끝이 들쭉날쭉」
        //    이었는데, 폭이 내용에 맞춰지는 드롭다운에는 해당하지 않는다.
        // ⚠️ **min-h-11(44px).** 거래완료 상태에서는 「삭제」 한 줄뿐이라 상자가 아주 작아진다.
        //    손가락이 닿을 크기를 지킨다.
        'border-outline-variant/40 flex min-h-11 w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left text-sm whitespace-nowrap transition-colors last:border-b-0 hover:bg-gray-50 active:bg-gray-100',
        tone === 'danger' ? 'text-danger-500' : 'text-gray-900'
      )}
    >
      {children}
    </button>
  )
}
