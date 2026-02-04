// src/hooks/useOutsideClick.ts
import { useEffect } from 'react'

interface AnyRef {
  current: Element | null
}

export function useOutsideClick(
  open: boolean,
  refs: AnyRef[],
  onClose: () => void
) {
  useEffect(() => {
    if (!open) return // 드롭다운이 닫혀있으면 아무것도 안함

    const handleDocumentMouseDown = (event: MouseEvent) => {
      const targetNode = event.target as Node // 클릭된 요소

      // refs 배열: [notificationButtonRef, notificationsDropdownRef]
      // 클릭된 노드를 포함하는 '안쪽 ref'를 찾는다
      const insideRef = refs.find((ref) => {
        const element = ref.current
        // 클릭된 요소가 해당 요소의 자식인지 확인
        return element ? element.contains(targetNode) : false
      })

      const clickedOutside = !insideRef // insideRef가 없으면 바깥 클릭이라는 것
      if (clickedOutside) onClose() // // 바깥 클릭이면 드롭다운 닫기(바깥 클릭시 실행되는 함수)
    }
    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () =>
      document.removeEventListener('mousedown', handleDocumentMouseDown)
  }, [open, refs, onClose])
}
