'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { cn } from '@/lib/utils/cn'
import { toResizedWebpUrl } from '@/lib/utils/imageUrl'

// 사진 확대창(#904). 사진을 누르면 화면을 덮고 **잘리지 않게** 보여준다.
//
// 왜 <dialog> 인가 — 이 저장소의 관례이고(LeaveChatRoomModal.tsx:27), ESC 로 닫기·
// 포커스 가두기·다른 것 위에 얹기를 브라우저가 대신 해준다.
//
// ⚠️ 눌렀을 때 하는 일이 **자리마다 다르다.**
//    검은 자리 = 닫기 · 사진 위 = 확대 토글. 갈라서 다뤄야 한다.
//
// ⚠️ jsdom 은 <dialog> 를 반쪽만 만든다(vitest.setup.ts 에서 showModal 을 흉내 낸다).
//    ESC 는 흉내 내지 않으므로 진짜 ESC 는 브라우저에서 눈으로 본다.

interface PhotoViewerProps {
  /** 원본 주소들. 크기 변환은 이 안에서 한다 */
  images: string[]
  startIndex?: number
  isOpen: boolean
  onClose: () => void
  /** 사진 설명. 「{alt} - {번호}」로 붙는다 */
  alt: string
}

export default function PhotoViewer({ images, startIndex = 0, isOpen, onClose, alt }: PhotoViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState(startIndex)

  // 실제 크기(1:1)로 보기. 세로로 긴 사진은 화면에 맞추면 **원본보다 작아진다** —
  // 800×1715 짜리가 높이 900 화면에서 폭 420 이 된다. 그래서 눌러서 원본 크기로 보게 한다.
  const [zoomed, setZoomed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 끌어서 움직이기. 실제 크기일 때만 쓴다 — 화면 맞춤일 때는 넘칠 것이 없다.
  // 「스크롤 자리를 손가락 움직인 만큼 반대로 민다」가 전부다.
  //
  // ⚠️ jsdom 에는 배치도 스크롤도 없어 이 부분은 시험으로 못 덮는다. 브라우저에서 눈으로 본다.
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)

  // ⚠️ 끌고 나서 손을 떼면 **click 이 뒤따라 온다**(표준 동작이다). 그냥 두면 사진을
  //    움직인 것만으로 확대가 풀리거나 창이 닫힌다. 「움직였다」를 기억해 두고
  //    그 다음 click 한 번을 흘린다.
  const movedRef = useRef(false)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = scrollRef.current
    if (!zoomed || !box) return
    dragRef.current = { x: event.clientX, y: event.clientY, left: box.scrollLeft, top: box.scrollTop }
    movedRef.current = false
    // jsdom 에는 없는 기능이다. 없으면 그냥 넘어간다(시험이 죽지 않게).
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current
    const box = scrollRef.current
    if (!start || !box) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    // 손가락은 가만히 있어도 몇 점씩 흔들린다. 그 정도는 「누른 것」으로 본다.
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true
    box.scrollLeft = start.left - dx
    box.scrollTop = start.top - dy
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }

  /** 끌고 난 직후의 click 인가. 맞으면 흘리고 기억을 지운다 */
  const isClickAfterDrag = () => {
    if (!movedRef.current) return false
    movedRef.current = false
    return true
  }

  // 열 때마다 누른 사진에서 시작한다.
  //
  // ⚠️ useEffect 로 하면 react-hooks/set-state-in-effect 가 막는다(lint 오류 = 게이트 막힘).
  //    렌더 도중에 맞추는 것이 이 저장소의 방식이다(#788, useFavorite.ts:27-31).
  //    「이전 값을 기억해 두고 달라졌을 때만」이 핵심이다 — 그냥 대입하면 매번 돌아
  //    넘겨 둔 사진이 첫 장으로 되돌아간다.
  const [prevOpen, setPrevOpen] = useState(isOpen)
  const [prevStartIndex, setPrevStartIndex] = useState(startIndex)
  if (prevOpen !== isOpen || prevStartIndex !== startIndex) {
    setPrevOpen(isOpen)
    setPrevStartIndex(startIndex)
    if (isOpen) {
      setIndex(startIndex)
      setZoomed(false)
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && !dialog?.open) {
      dialog?.showModal()
    } else if (!isOpen && dialog?.open) {
      dialog?.close()
    }
  }, [isOpen])

  // ESC. 리액트의 onCancel 대신 요소에 직접 단다 —
  // cancel 은 위로 올라가지 않는(bubbles: false) 사건이라 직접 다는 쪽이 확실하다.
  // preventDefault 로 브라우저가 혼자 닫는 것을 막는다. 여는 쪽(isOpen)만 문을 쥐게 둔다.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  const hasMultiple = images.length > 1
  // 넘기면 화면 맞춤으로 되돌린다 — 확대한 채로 넘어가면 다음 사진의 한 귀퉁이만 보인다.
  const go = (step: number) => {
    setZoomed(false)
    setIndex((prev) => (prev + step + images.length) % images.length)
  }

  return (
    <dialog
      ref={dialogRef}
      data-testid="photo-viewer"
      className="m-0 h-full max-h-full w-full max-w-full bg-transparent p-0 backdrop:bg-black/90"
    >
      {isOpen && images.length > 0 ? (
        <div className="relative flex h-full w-full flex-col bg-black/95">
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="absolute top-2 right-2 z-20 flex h-12 w-12 cursor-pointer items-center justify-center text-white transition-opacity hover:opacity-80"
          >
            <X size={28} strokeWidth={1.5} />
          </button>

          {/* 검은 자리 = 닫기. 사진은 아래에서 눌림을 멈춰 세운다 */}
          <div
            ref={scrollRef}
            data-testid="photo-viewer-backdrop"
            onClick={() => {
              if (isClickAfterDrag()) return
              onClose()
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={cn('flex flex-1 items-center justify-center', zoomed ? 'overflow-auto' : 'overflow-hidden')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={toResizedWebpUrl(images[index], 800)}
              alt={`${alt} - ${index + 1}`}
              data-zoomed={zoomed}
              draggable={false}
              onClick={(event) => {
                event.stopPropagation()
                if (isClickAfterDrag()) return
                setZoomed((prev) => !prev)
              }}
              className={cn(
                'm-auto select-none',
                zoomed ? 'max-w-none cursor-zoom-out' : 'max-h-full max-w-full cursor-zoom-in object-contain'
              )}
            />
          </div>

          {hasMultiple ? (
            <>
              <button
                type="button"
                aria-label="이전 이미지"
                onClick={() => go(-1)}
                className="absolute top-1/2 left-2 z-20 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center text-white transition-opacity hover:opacity-80"
              >
                <ChevronLeft size={44} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label="다음 이미지"
                onClick={() => go(1)}
                className="absolute top-1/2 right-2 z-20 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center text-white transition-opacity hover:opacity-80"
              >
                <ChevronRight size={44} strokeWidth={1.5} />
              </button>
              <p className={cn('absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white')}>
                {index + 1} / {images.length}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </dialog>
  )
}
