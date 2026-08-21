import { type RefObject, useEffect, useRef } from 'react'

// 손으로 만든 오버레이에 **초점을 가둔다**(#981).
//
// `role="dialog" aria-modal="true"` 를 달아 놓고도 초점이 안 갇히면, 화면낭독기에는
// 「지금 이 상자만 쓰는 중」이라고 알려 놓고 실제로는 뒤가 만져진다 — 알린 것과 동작이 다르다.
//
// ⚠️ `<dialog>` 를 쓰는 곳(관리자 모달 다섯)은 **브라우저가 가둬 준다.** 이 훅이 필요 없다.
//    그렇다고 손으로 만든 것들을 `<dialog>` 로 바꾸는 것도 조심해야 한다 — jsdom 이 그것을
//    반쪽만 만들어서 시험이 못 잡는 자리가 생긴다(프로젝트 CLAUDE.md).
//
// ⚠️ **ESC 로 닫기는 여기서 하지 않는다.** 이미 다섯 곳이 각자 하고 있어 겹친다.
//    이 훅은 「초점」만 맡는다.

/** 초점을 받을 수 있는 것들. 화면에서 감춰진 것은 아래에서 걸러낸다. */
const 초점가능 = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function 초점받을것들(상자: HTMLElement): HTMLElement[] {
  return Array.from(상자.querySelectorAll<HTMLElement>(초점가능)).filter((el) => {
    // 감춘 것에 초점을 주면 사용자가 초점을 잃어버린다.
    //
    // ⚠️ **크기(offsetWidth·offsetHeight)로 재면 안 된다.** jsdom 에는 배치가 없어 늘 0 이라
    //    시험에서 요소가 통째로 걸러진다(프로젝트 CLAUDE.md 의 「시험이 못 보는 것」).
    //    getComputedStyle 은 jsdom 도 준다.
    if (el.hasAttribute('hidden') || el.closest('[hidden]')) return false
    const 스타일 = window.getComputedStyle(el)
    return 스타일.display !== 'none' && 스타일.visibility !== 'hidden'
  })
}

/**
 * 열려 있는 동안 초점을 상자 안에 가둔다.
 *
 * - 열면 상자 안 첫 요소로 초점을 옮긴다 (상자 자신이 `tabIndex={-1}` 이면 그쪽을 먼저 쓴다)
 * - 탭·시프트탭이 상자 안에서만 돈다
 * - 닫으면 **열기 전에 있던 자리**로 초점을 되돌린다
 *
 * @param isOpen 열려 있는가
 * @returns 상자에 달 ref
 */
export function useFocusTrap<T extends HTMLElement>(isOpen: boolean): RefObject<T | null> {
  const 상자 = useRef<T>(null)
  // 열기 전에 초점이 있던 자리. 닫을 때 여기로 되돌린다.
  const 돌아갈곳 = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const 열때상자 = 상자.current
    if (!열때상자) return

    돌아갈곳.current = document.activeElement as HTMLElement | null

    // 열면 안으로 넣는다. 상자 자신이 초점을 받을 수 있으면(tabIndex={-1}) 그쪽이 낫다 —
    // 화면낭독기가 상자의 이름부터 읽어 준다.
    const 첫것 = 초점받을것들(열때상자)
    if (열때상자.tabIndex >= 0 || 열때상자.hasAttribute('tabindex')) 열때상자.focus()
    else 첫것[0]?.focus()

    const 탭가두기 = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      // ⚠️ **여기서 다시 읽는다.** 효과가 돌 때의 노드를 붙잡아 두면, 그 뒤 부모가 다시
      //    그려져 DOM 노드가 새로 만들어졌을 때 **없어진 옛 노드**를 보게 된다. 그러면
      //    `contains` 가 늘 거짓이라 탭을 누를 때마다 첫 요소로 되돌아간다 —
      //    바텀시트(createPortal 로 그린다)에서 실제로 그랬다(2026-08-21).
      const 지금상자 = 상자.current
      if (!지금상자) return

      const 것들 = 초점받을것들(지금상자)
      if (것들.length === 0) {
        // 안에 초점 줄 게 없으면 밖으로 나가지 못하게 막기만 한다.
        event.preventDefault()
        return
      }

      const 처음 = 것들[0]
      const 마지막 = 것들[것들.length - 1]
      const 지금 = document.activeElement

      // ⚠️ **상자 밖에 초점이 있을 때 도로 데려오는 짓은 하지 않는다.**
      //    한 번 넣었다가 바텀시트에서 탈이 났다(2026-08-21) — 화면이 다시 그려지며 초점이
      //    잠깐 body 로 빠지면, 탭을 누를 때마다 첫 항목으로 되돌려져 **초점이 한 자리에 갇혔다.**
      //    경계에서 돌려세우는 것(아래)만으로 가둠은 이뤄진다.
      if (!지금상자.contains(지금)) return

      if (event.shiftKey && 지금 === 처음) {
        event.preventDefault()
        마지막.focus()
      } else if (!event.shiftKey && 지금 === 마지막) {
        event.preventDefault()
        처음.focus()
      }
    }

    document.addEventListener('keydown', 탭가두기)
    return () => {
      document.removeEventListener('keydown', 탭가두기)
      // 닫을 때 원래 자리로. 그 요소가 사라졌으면(목록에서 열었는데 목록이 바뀌었다) 아무 일도 안 한다.
      const 자리 = 돌아갈곳.current
      if (자리 && document.contains(자리)) 자리.focus()
    }
  }, [isOpen])

  return 상자
}
