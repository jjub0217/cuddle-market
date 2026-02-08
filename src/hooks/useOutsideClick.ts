import { type RefObject, useEffect, useRef } from 'react'

export function useOutsideClick(open: boolean, refs: RefObject<Element | null>[], onClose: () => void) {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const handleMouseDown = (event: MouseEvent) => {
      const targetNode = event.target as Node
      const isInside = refs.some((ref) => ref.current?.contains(targetNode))
      if (!isInside) onCloseRef.current()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, refs])
}
