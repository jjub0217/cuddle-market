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

  // 두 가지 크기로 본다.
  //
  //   화면 맞춤   사진 전체가 다 보이게. 작으면 키우고 크면 줄인다 (아래 FIT_MAX_SCALE)
  //   크게        원본의 두 배. 화면을 넘치므로 끌어서 움직여 본다
  //
  // ⚠️ 「크게」를 원본 크기(1:1)로 뒀더니 **누르면 오히려 작아졌다**(2026-08-13).
  //    화면 맞춤이 이미 원본보다 크게 키우기 때문이다 — 600×800 사진이 높이 1000 화면에서
  //    1.26배가 된다. 두 상태의 크기 순서가 뒤집히지 않게, 「크게」는 맞춤의 상한과
  //    같은 값(원본의 두 배)으로 못 박는다.
  const [zoomed, setZoomed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 사진의 진짜 알갱이 크기. **화면에 맞춰 키울 때 어디까지 키울지**를 여기서 정한다.
  //
  // ⚠️ max-h-full·max-w-full 만 주면 **상한만 정해져 원본보다 크게는 안 된다.**
  //    600×800 사진이 높이 1000 넘는 모니터에서 600×800 그대로 떠서 가운데 조그맣게
  //    보였다(2026-08-13에 확인). 그래서 h-full·w-full 로 채우되, 여기서 잰 크기의
  //    두 배를 상한으로 건다 — 그보다 키우면 뭉개짐이 눈에 띈다.
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null)

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
    // ⚠️ 손가락(터치)은 **브라우저가 알아서 밀어 준다**(overflow-auto). 우리가 또 밀면
    //    둘이 겨뤄서 모바일 웹에서 미끄러지듯 튄다. 마우스일 때만 우리가 민다.
    if (!zoomed || !box || event.pointerType === 'touch') return
    dragRef.current = { x: event.clientX, y: event.clientY, left: box.scrollLeft, top: box.scrollTop }
    movedRef.current = false
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current
    const box = scrollRef.current
    if (!start || !box) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    // 손은 가만히 있어도 몇 점씩 흔들린다. 그 정도는 「누른 것」으로 본다.
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      // ⚠️ 붙잡기는 **움직이기 시작한 뒤에** 건다. 누르자마자 걸면 뒤따라오는 click 이
      //    사진이 아니라 **붙잡은 쪽(검은 자리)** 으로 가서, 확대를 끄려고 누른 것이
      //    창을 닫아 버린다. 2026-08-13 에 실제로 그랬다.
      //    ⚠️ jsdom 에는 붙잡기가 없어 **시험으로 못 잡는다** — 브라우저에서만 드러난다.
      if (!movedRef.current) event.currentTarget.setPointerCapture?.(event.pointerId)
      movedRef.current = true
    }
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

  // 확대 제스처를 **사진 위에서만** 가로챈다.
  //
  // 트랙패드로 벌리는 것과 ⌘(Ctrl)+휠은 브라우저에 **ctrl 이 눌린 휠**로 똑같이 온다.
  // 그냥 두면 브라우저가 화면 전체를 키워 X 단추·화살표·번호가 화면 밖으로 밀려난다.
  //
  // ⚠️ **검은 자리는 일부러 안 가로챈다.** 번개장터도 그렇게 한다(2026-08-13 확인) —
  //    사진 위에서 벌리면 사진만 커지고, 검은 자리에서 벌리면 브라우저 확대가 그대로 된다.
  //    처음에는 창 전체를 가로챘는데, 그러면 「페이지를 키워서 보고 싶다」는 길이 아예 막힌다.
  //
  // ⚠️ 리액트의 onWheel 로는 못 막는다 — 리액트가 휠을 passive 로 달아서
  //    preventDefault 가 무시된다. 요소에 직접, passive: false 로 달아야 한다.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !isOpen) return
    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return
      // 사진 위가 아니면 브라우저에 맡긴다.
      if (!(event.target instanceof HTMLImageElement)) return
      event.preventDefault()
      // 벌리면(위로) 크게, 오므리면 화면 맞춤.
      setZoomed(event.deltaY < 0)
    }
    dialog.addEventListener('wheel', handleWheel, { passive: false })
    return () => dialog.removeEventListener('wheel', handleWheel)
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
  // 사진마다 알갱이 크기가 다르므로 잰 값도 지운다.
  const go = (step: number) => {
    setZoomed(false)
    setNatural(null)
    setIndex((prev) => (prev + step + images.length) % images.length)
  }

  /**
   * 원본의 몇 배까지 키울지. 그 위는 뭉개짐이 눈에 띈다.
   * 화면 맞춤의 상한이자 「크게」의 크기다 — 둘이 같은 값이라야 순서가 안 뒤집힌다.
   */
  const MAX_SCALE = 2
  const sizeStyle = natural
    ? zoomed
      ? // 크게 — 원본의 두 배로 못 박는다. 화면을 넘치면 끌어서 본다
        { width: natural.width * MAX_SCALE, height: 'auto' as const, maxWidth: 'none' as const }
      : // 화면 맞춤 — 화면을 채우되 두 배를 넘지 않는다
        { maxWidth: natural.width * MAX_SCALE, maxHeight: natural.height * MAX_SCALE }
    : undefined

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
              onLoad={(event) => {
                const img = event.currentTarget
                setNatural({ width: img.naturalWidth, height: img.naturalHeight })
              }}
              onClick={(event) => {
                event.stopPropagation()
                if (isClickAfterDrag()) return
                setZoomed((prev) => !prev)
              }}
              // 화면 맞춤은 h-full·w-full 로 **채운다**. max-h-full 만 주면 원본보다
              // 크게는 안 커져서 작은 사진이 큰 모니터에 조그맣게 뜬다.
              // 크기의 상한·「크게」의 크기는 style 이 정한다(위 sizeStyle).
              style={sizeStyle}
              className={cn(
                'm-auto select-none',
                zoomed ? 'cursor-zoom-out' : 'h-full w-full cursor-zoom-in object-contain'
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
