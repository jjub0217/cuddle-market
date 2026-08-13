'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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

  // 배율. **1 = 화면 맞춤**(사진 전체가 다 보이는 크기)이고, 거기서 최대 세 배까지 키운다.
  //
  //   화면 맞춤(1배)   원본보다 크게는 안 키운다 — 화면보다 클 때만 줄인다
  //   최대(3배)        맞춤의 세 배. 맞춤이 원본을 안 넘으므로 **원본의 세 배가 상한**이다
  //
  // ⚠️ 처음에는 두 값(맞춤·2배)만 오갔는데 **손가락을 안 따라와 「퉁」 튀었다.**
  //    벌리는 만큼 사이 값이 나오게 바꿨다(2026-08-13, 번개장터도 그렇다).
  //
  // ⚠️ 크기를 **transform 으로** 준다. 폭을 직접 늘리면 화면에 맞는 크기를 매번 재야 하고
  //    창 크기가 바뀔 때마다 다시 재야 한다. transform 은 「지금 보이는 크기의 몇 배」라
  //    잴 것이 없다.
  // ⚠️ **앱과 같은 값을 쓴다**(mobile/components/photo-viewer/photo-viewer.tsx).
  //    앱은 더블탭 2배 · 핀치 최대 3배다. 웹은 클릭 2배 · 휠 최대 3배로 짝을 맞춘다.
  //    번개장터는 5배까지 되지만 **그쪽은 원본이 크다** — 우리는 올릴 때 800px 로 줄이고
  //    있어서 5배로 키우면 알갱이가 네모 덩어리로 보인다. 더 키우려면 올리는 크기부터
  //    키워야 한다(별도 이슈).
  const MIN_SCALE = 1
  const MAX_SCALE = 3
  /** 눌렀을 때 가는 배율. 앱의 더블탭과 같다 */
  const CLICK_SCALE = 2
  const [scale, setScale] = useState(MIN_SCALE)
  // 밀어 둔 자리. 키운 뒤 화면 밖으로 나간 데를 보려고 움직인 만큼이다.
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // 맞춤으로 돌아오면 밀어 둔 자리도 제자리로. (렌더 도중에 맞춘다 — useFavorite.ts 와 같은 방식)
  if (scale === MIN_SCALE && (offset.x !== 0 || offset.y !== 0)) {
    setOffset({ x: 0, y: 0 })
  }

  const clampScale = (value: number) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE)

  // 사진 틀. **확대해도 이 틀은 안 변한다** — 틀 안에서 사진만 커지고 넘치면 잘린다.
  // 번개장터도 이렇게 한다(2026-08-13에 스크린샷으로 확인). 그래서 넘기는 화살표·번호가
  // 늘 같은 자리에 있어 화면이 출렁이지 않는다.
  //
  // 틀 크기를 알려면 **화면 크기와 사진 알갱이 크기** 둘 다 필요하다.
  //   틀 = 사진을 화면 안에 다 넣는 크기 (단, 원본보다 크게는 안 키운다)
  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<{ width: number; height: number } | null>(null)
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    const stageEl = stageRef.current
    if (!stageEl || !isOpen) return
    const 재기 = () => setStage({ width: stageEl.clientWidth, height: stageEl.clientHeight })
    재기()
    const 지켜보기 = new ResizeObserver(재기)
    지켜보기.observe(stageEl)
    return () => 지켜보기.disconnect()
  }, [isOpen])

  const frame =
    stage && natural
      ? (() => {
          // 원본보다 크게는 안 키운다 — 없는 알갱이는 만들어지지 않는다.
          const 맞춤배율 = Math.min(1, stage.width / natural.width, stage.height / natural.height)
          return { width: natural.width * 맞춤배율, height: natural.height * 맞춤배율 }
        })()
      : null

  /** 끌어서 갈 수 있는 한계. 틀 밖으로는 못 민다 — 밀어 봐야 빈자리만 보인다 */
  const panLimit = frame
    ? { x: (frame.width * (scale - 1)) / 2, y: (frame.height * (scale - 1)) / 2 }
    : { x: 0, y: 0 }
  // 휠 처리기(useEffect)가 이걸 부르므로 한계가 바뀔 때만 새로 만든다.
  // 매번 새로 만들면 처리기를 매 렌더마다 다시 달게 된다.
  const clampOffset = useCallback(
    (x: number, y: number) => ({
      x: Math.min(Math.max(x, -panLimit.x), panLimit.x),
      y: Math.min(Math.max(y, -panLimit.y), panLimit.y),
    }),
    [panLimit.x, panLimit.y]
  )

  // 끌어서 움직이기. 키운 상태에서만 쓴다 — 맞춤일 때는 넘칠 것이 없다.
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)

  // ⚠️ 끌고 나서 손을 떼면 **click 이 뒤따라 온다**(표준 동작이다). 그냥 두면 사진을
  //    움직인 것만으로 확대가 풀리거나 창이 닫힌다. 「움직였다」를 기억해 두고
  //    그 다음 click 한 번을 흘린다.
  const movedRef = useRef(false)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (scale <= MIN_SCALE) return
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: offset.x, offsetY: offset.y }
    movedRef.current = false
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current
    if (!start) return
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
    setOffset(clampOffset(start.offsetX + dx, start.offsetY + dy))
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
      setScale(MIN_SCALE)
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
      // ⚠️ 맥에서 「확대」는 두 갈래로 들어온다.
      //      두 손가락 벌리기      ctrl 이 눌린 휠   (브라우저가 그렇게 바꿔 보낸다)
      //      ⌘ + 두 손가락 쓸기    ⌘(meta) 가 눌린 휠
      //    ctrl 만 받았더니 ⌘ 로 하는 사람에게는 아무 일도 안 일어났다(2026-08-13).
      if (event.ctrlKey || event.metaKey) {
        // 사진 위가 아니면 브라우저에 맡긴다.
        if (!(event.target instanceof HTMLImageElement)) return
        event.preventDefault()
        // 벌린 만큼 곱해서 키운다. 더하기가 아니라 곱하기라야 어느 배율에서든 같은 속도로 느껴진다.
        setScale((prev) => clampScale(prev * Math.exp(-event.deltaY / 100)))
        return
      }
      // 키운 상태에서 두 손가락으로 쓸면 사진을 움직인다. 맞춤일 때는 건드리지 않는다.
      if (scale <= MIN_SCALE) return
      event.preventDefault()
      setOffset((prev) => clampOffset(prev.x - event.deltaX, prev.y - event.deltaY))
    }
    dialog.addEventListener('wheel', handleWheel, { passive: false })
    return () => dialog.removeEventListener('wheel', handleWheel)
    // 배율이 바뀔 때마다 처리기를 다시 단다. 「지금 배율」을 봐야 쓸기와 확대를 가를 수 있고,
    // 붙였다 떼는 일은 값싸다. (ref 에 넣어 두는 방법은 린트가 막는다 — 렌더 중 ref 쓰기)
  }, [isOpen, scale, clampOffset])

  // 뒤로가기로 확대창만 닫는다.
  //
  // 그냥 두면 확대창은 브라우저 기록에 안 남아서, 뒤로가기가 **상품 상세에서 나가** 버린다.
  // 사진 보다가 한 번에 목록으로 튕겨 나가면 보던 자리를 잃는다. 앱은 이미 그렇지 않다
  // (뒤로가기 = 확대창만 닫힘). 매체마다 다르게 움직이면 안 된다.
  //
  // 열 때 기록을 한 칸 넣어 두고, 뒤로가기가 그 칸을 지우면 창을 닫는다.
  // ⚠️ 단추·ESC 로 닫을 때는 **넣어 둔 칸을 우리가 도로 빼야 한다.** 안 빼면 창을 닫은 뒤에도
  //    뒤로가기 한 번이 헛돈다(아무 일도 안 일어나는 뒤로가기).
  // ⚠️ **`onClose` 를 의존성에 넣으면 안 된다.** 쓰는 쪽이 `onClose={() => …}` 처럼 그 자리에서
  //    만들어 넘기면 렌더마다 새 함수가 되고, 그러면 이 효과가 매번 다시 돌면서
  //    **기록을 넣었다 뺐다** 한다. 실제로 뒤로가기 한 번에 홈까지 밀려났다(2026-08-13).
  //    최신 `onClose` 는 상자에 담아 두고 여기서는 꺼내 쓴다.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const pushedRef = useRef(false)
  useEffect(() => {
    if (!isOpen) return
    window.history.pushState({ photoViewer: true }, '')
    pushedRef.current = true
    const handlePopState = () => {
      // 브라우저가 이미 그 칸을 지웠다 — 우리가 또 뺄 필요가 없다.
      pushedRef.current = false
      onCloseRef.current()
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      if (pushedRef.current) {
        pushedRef.current = false
        window.history.back()
      }
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
  // 넘기면 화면 맞춤으로 되돌린다 — 키운 채로 넘어가면 다음 사진의 한 귀퉁이만 보인다.
  const go = (step: number) => {
    setScale(MIN_SCALE)
    setIndex((prev) => (prev + step + images.length) % images.length)
  }

  const zoomed = scale > MIN_SCALE
  // 맞춤일 때는 아예 안 건다 — 안 걸어야 브라우저가 사진을 있는 그대로 그린다.
  const sizeStyle = zoomed
    ? { transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, touchAction: 'none' as const }
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
            ref={stageRef}
            data-testid="photo-viewer-backdrop"
            onClick={() => {
              if (isClickAfterDrag()) return
              onClose()
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative flex flex-1 items-center justify-center overflow-hidden"
          >
            {/* 사진 틀 — 크기가 고정이다. 안에서 사진만 커지고 넘치면 잘린다.
                아직 크기를 못 쟀으면(첫 그림·시험) 틀 없이 사진만 그린다. */}
            <div
              data-testid="photo-viewer-frame"
              className="relative overflow-hidden"
              style={frame ? { width: frame.width, height: frame.height } : undefined}
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
                  // 누르면 2배 한 번에(앱 더블탭과 같다). 손가락으로는 사이 값도 고를 수 있다.
                  setScale((prev) => (prev > MIN_SCALE ? MIN_SCALE : CLICK_SCALE))
                }}
                style={sizeStyle}
                className={cn(
                  'block select-none object-contain',
                  frame ? 'h-full w-full' : 'max-h-full max-w-full',
                  zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                )}
              />

              {hasMultiple ? (
                <>
                  {/*
                    넘기는 단추는 **틀 안쪽 양 끝**에 붙인다. 틀이 안 변하니 확대해도
                    자리가 그대로다 — 화면 끝에 두면 사진에서 눈이 멀어져 있는 줄도 모른다.
                  */}
                  <button
                    type="button"
                    aria-label="이전 이미지"
                    onClick={() => go(-1)}
                    className="absolute top-1/2 left-2 z-20 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] transition-opacity hover:opacity-80"
                  >
                    <ChevronLeft size={44} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="다음 이미지"
                    onClick={() => go(1)}
                    className="absolute top-1/2 right-2 z-20 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] transition-opacity hover:opacity-80"
                  >
                    <ChevronRight size={44} strokeWidth={1.5} />
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {hasMultiple ? (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white">
              {index + 1} / {images.length}
            </p>
          ) : null}
        </div>
      ) : null}
    </dialog>
  )
}
