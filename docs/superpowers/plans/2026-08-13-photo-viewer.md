# 사진 확대창 구현 계획 (#904)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사진을 누르면 화면을 덮는 창이 떠서 **잘린 곳 없이** 보이고, 앱에서는 손가락으로 넓혀 볼 수 있게 한다.

**Architecture:** 매체마다 확대창을 **하나씩만** 만든다(웹 `PhotoViewer` · 앱 `PhotoViewer`). 여섯 군데(상품 상세·채팅·커뮤니티 × 웹·앱)는 그 창을 불러다 쓰기만 한다. 웹은 네이티브 `<dialog>` 를 쓰고, 앱은 `Modal` + 이미 들어 있는 제스처 라이브러리를 쓴다.

**Tech Stack:** 웹 = Next.js 16 · React 19 · Tailwind v4 · vitest(jsdom) + RTL / 앱 = Expo SDK 54 · react-native-gesture-handler 2.28 · react-native-reanimated 4.1 · Jest(jest-expo) + RNTL 14

설계 문서: `docs/superpowers/specs/2026-08-13-photo-viewer-design.md`

## Global Constraints

모든 작업에 아래가 그대로 걸린다.

```
브랜치        feat/904--photo-viewer  (origin/develop 에서 땄다. main·develop 직접 커밋 금지)
PR base       develop · 본문 관련 이슈는 목록 항목으로 `- Close #904`
새 의존성     앱은 0 개. gesture-handler·reanimated 는 이미 있다.
              바꾸면 EAS 빌드로 다시 확인해야 한다(mobile/AGENTS.md)
웹 사진 태그   CDN 사진은 <img> + `// eslint-disable-next-line @next/next/no-img-element`
              (next/image 는 로고·아이콘 같은 붙박이 자산에만 쓴다)
사진 주소     toResizedWebpUrl(url, 800) — 지금 있는 것 중 가장 큰 것. 1600 은 없다(403)
문구         웹과 앱이 같은 말을 쓴다. 닫기 단추 이름은 양쪽 다 `닫기`
들여쓰기      손으로 맞춘다. ⚠️ 웹 파일에 `npx prettier --write` 를 돌리지 말 것
게이트        웹 `pnpm gate` · 앱 `pnpm gate:mobile` (둘 다 저장소 루트에서)
```

⚠️ **jsdom 은 `<dialog>` 를 반쪽만 만든다.** `showModal()`·`close()` 는 `vitest.setup.ts:41-56` 에서 흉내 낸 것이고 **ESC 는 흉내 내지 않는다.** ESC 시험은 `cancel` 사건을 직접 쏘아 「연결이 되어 있는가」까지만 지킨다.

⚠️ **안드로이드에서 `Modal` 안은 별개의 창이다.** 바깥(`mobile/app/_layout.tsx:35`)에 씌운 `GestureHandlerRootView` 가 안까지 닿지 않아서, 안에서 다시 감싸지 않으면 **오류도 로그도 없이 조용히 안 끌린다**(`mobile/components/ui/bottom-sheet.tsx:288-296` 에 같은 함정이 적혀 있다).

⚠️ **RNTL 14 의 `render`·`rerender`·`fireEvent` 는 셋 다 `await` 해야 한다**(`mobile/AGENTS.md`).

---

## 파일 구조

```
새로 만든다
  src/components/photo-viewer/PhotoViewer.tsx         웹 확대창 (하나뿐)
  src/components/photo-viewer/PhotoViewer.test.tsx
  mobile/components/photo-viewer/photo-viewer.tsx     앱 확대창 (하나뿐)
  mobile/components/photo-viewer/photo-viewer.test.tsx

고친다 — 1단계
  src/features/product-detail/components/MainImage.tsx
  src/features/product-detail/components/MainImage.test.tsx
  mobile/components/product-detail/image-carousel.tsx
  mobile/components/product-detail/image-carousel.test.tsx   (없으면 새로 만든다)

고친다 — 2단계
  src/features/chatting-page/components/ChatLog.tsx
  mobile/components/chat/message-bubble.tsx
  mobile/components/chat/message-bubble.test.tsx

고친다 — 3단계
  src/features/community/components/markdown/MdPreview.tsx
  src/features/community/CommunityDetail.tsx
  mobile/components/community/post-body.tsx
  mobile/components/community/post-body.test.tsx
```

## 단계와 PR

```
1단계 (PR 1)  Task 1~7   확대창 둘 + 상품 상세     ← 제일 크다
2단계 (PR 2)  Task 8~9   채팅
3단계 (PR 3)  Task 10~11 커뮤니티
```

각 단계 끝에서 게이트를 돌리고 **사용자 눈 확인**을 받은 뒤 다음으로 넘어간다.

---

# 1단계 — 확대창 둘 + 상품 상세

### Task 1: 웹 확대창 뼈대 (열기·닫기·여러 장 넘기기)

**Files:**
- Create: `src/components/photo-viewer/PhotoViewer.tsx`
- Test: `src/components/photo-viewer/PhotoViewer.test.tsx`

**Interfaces:**
- Consumes: `toResizedWebpUrl(url: string | null | undefined, size: 150|400|800): string` — `@/lib/utils/imageUrl` · `cn(...)` — `@/lib/utils/cn`
- Produces:
  ```ts
  interface PhotoViewerProps {
    images: string[]      // 원본 주소들(변환 전). 빈 배열이면 아무것도 안 그린다
    startIndex?: number   // 기본 0
    isOpen: boolean
    onClose: () => void
    alt: string           // 사진 설명. 「{alt} - {번호}」로 붙는다
  }
  export default function PhotoViewer(props: PhotoViewerProps): React.ReactElement
  ```

- [ ] **Step 1: 실패하는 시험을 쓴다**

`src/components/photo-viewer/PhotoViewer.test.tsx`

```tsx
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { render } from '@/test/render'

import PhotoViewer from './PhotoViewer'

// 사진 확대창(#904).
//
// ⚠️ 이 시험이 **안 덮는 것**: 진짜 ESC 키, 화면을 덮는 층(top layer), 끌어서 움직이기.
//    jsdom 에는 배치도 스크롤도 없고 <dialog> 도 반쪽만 있다(vitest.setup.ts).
//    그것들은 브라우저에서 눈으로 본다.

const IMAGES = ['https://cdn/a.jpg', 'https://cdn/b.jpg', 'https://cdn/c.jpg']

describe('열고 닫기', () => {
  it('닫혀 있으면 사진을 안 그린다', () => {
    render(<PhotoViewer images={IMAGES} isOpen={false} onClose={vi.fn()} alt="캣타워" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('열려 있으면 시작 사진을 그린다', () => {
    render(<PhotoViewer images={IMAGES} startIndex={1} isOpen onClose={vi.fn()} alt="캣타워" />)

    expect(screen.getByAltText('캣타워 - 2')).toBeInTheDocument()
  })

  it('닫기 단추를 누르면 닫힌다고 알린다', () => {
    const 닫힘 = vi.fn()
    render(<PhotoViewer images={IMAGES} isOpen onClose={닫힘} alt="캣타워" />)

    fireEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(닫힘).toHaveBeenCalledOnce()
  })

  it('검은 자리를 누르면 닫힌다고 알린다', () => {
    const 닫힘 = vi.fn()
    render(<PhotoViewer images={IMAGES} isOpen onClose={닫힘} alt="캣타워" />)

    fireEvent.click(screen.getByTestId('photo-viewer-backdrop'))

    expect(닫힘).toHaveBeenCalledOnce()
  })

  it('사진을 눌러도 닫히지 않는다', () => {
    const 닫힘 = vi.fn()
    render(<PhotoViewer images={IMAGES} isOpen onClose={닫힘} alt="캣타워" />)

    fireEvent.click(screen.getByAltText('캣타워 - 1'))

    expect(닫힘).not.toHaveBeenCalled()
  })

  // ESC 는 브라우저가 dialog 에 'cancel' 을 쏘는 것으로 시작한다.
  // jsdom 은 키를 눌러도 안 쏘므로 사건을 직접 쏜다 — 연결만 지킨다.
  it('ESC(cancel 사건)로 닫힌다고 알린다', () => {
    const 닫힘 = vi.fn()
    render(<PhotoViewer images={IMAGES} isOpen onClose={닫힘} alt="캣타워" />)

    fireEvent(screen.getByTestId('photo-viewer'), new Event('cancel'))

    expect(닫힘).toHaveBeenCalledOnce()
  })
})

describe('여러 장 넘기기', () => {
  it('한 장이면 넘기는 단추가 없다', () => {
    render(<PhotoViewer images={[IMAGES[0]]} isOpen onClose={vi.fn()} alt="캣타워" />)

    expect(screen.queryByRole('button', { name: '다음 이미지' })).not.toBeInTheDocument()
  })

  it('다음을 누르면 다음 사진이 나온다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }))

    expect(screen.getByAltText('캣타워 - 2')).toBeInTheDocument()
  })

  it('마지막에서 다음을 누르면 처음으로 돌아온다', () => {
    render(<PhotoViewer images={IMAGES} startIndex={2} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }))

    expect(screen.getByAltText('캣타워 - 1')).toBeInTheDocument()
  })

  it('몇 번째인지 보여준다', () => {
    render(<PhotoViewer images={IMAGES} startIndex={1} isOpen onClose={vi.fn()} alt="캣타워" />)

    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm test src/components/photo-viewer/PhotoViewer.test.tsx
```
기대: `Failed to resolve import "./PhotoViewer"` 로 전부 실패.

- [ ] **Step 3: 확대창을 만든다 (확대는 아직 없다)**

`src/components/photo-viewer/PhotoViewer.tsx`

```tsx
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

  // 열 때마다 누른 사진에서 시작한다.
  useEffect(() => {
    if (isOpen) setIndex(startIndex)
  }, [isOpen, startIndex])

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
  const go = (step: number) => setIndex((prev) => (prev + step + images.length) % images.length)

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
            data-testid="photo-viewer-backdrop"
            onClick={onClose}
            className="flex flex-1 items-center justify-center overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={toResizedWebpUrl(images[index], 800)}
              alt={`${alt} - ${index + 1}`}
              onClick={(event) => event.stopPropagation()}
              className="max-h-full max-w-full object-contain"
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
```

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm test src/components/photo-viewer/PhotoViewer.test.tsx
```
기대: 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/photo-viewer
git commit -m "feat(web): 사진 확대창 뼈대 (#904)"
```

---

### Task 2: 웹 확대창 — 실제 크기 토글과 끌어서 움직이기

세로로 긴 사진은 화면에 맞추면 **원본보다 작아진다**(800×1715 사진이 높이 900 화면에서 폭 420). 눌러서 실제 크기로 볼 수 있게 한다.

**Files:**
- Modify: `src/components/photo-viewer/PhotoViewer.tsx`
- Test: `src/components/photo-viewer/PhotoViewer.test.tsx` (이어 쓴다)

**Interfaces:**
- Consumes: Task 1 의 `PhotoViewer`
- Produces: 사진 `<img>` 에 `data-zoomed="true" | "false"` 가 붙는다. 겉모습 값(class)은 시험이 보지 않는다

- [ ] **Step 1: 실패하는 시험을 이어 쓴다**

`PhotoViewer.test.tsx` 맨 아래에 붙인다.

```tsx
describe('실제 크기로 보기', () => {
  it('처음에는 화면 맞춤이다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'false')
  })

  it('사진을 누르면 실제 크기가 된다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByAltText('캣타워 - 1'))

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'true')
  })

  it('한 번 더 누르면 화면 맞춤으로 돌아온다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByAltText('캣타워 - 1'))
    fireEvent.click(screen.getByAltText('캣타워 - 1'))

    expect(screen.getByAltText('캣타워 - 1')).toHaveAttribute('data-zoomed', 'false')
  })

  it('다음 사진으로 넘어가면 화면 맞춤으로 돌아온다', () => {
    render(<PhotoViewer images={IMAGES} isOpen onClose={vi.fn()} alt="캣타워" />)

    fireEvent.click(screen.getByAltText('캣타워 - 1'))
    fireEvent.click(screen.getByRole('button', { name: '다음 이미지' }))

    expect(screen.getByAltText('캣타워 - 2')).toHaveAttribute('data-zoomed', 'false')
  })
})
```

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm test src/components/photo-viewer/PhotoViewer.test.tsx
```
기대: 새 시험 넷이 `data-zoomed` 속성이 없다며 실패.

- [ ] **Step 3: 확대를 붙인다**

`PhotoViewer.tsx` 를 아래 세 군데 고친다.

(1) 상태와 끌기 손잡이를 더한다 — `const [index, setIndex] = useState(startIndex)` 바로 아래.

```tsx
  const [zoomed, setZoomed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 끌어서 움직이기. 실제 크기일 때만 쓴다 — 화면 맞춤일 때는 넘칠 것이 없다.
  // 「스크롤 자리를 손가락 움직인 만큼 반대로 민다」가 전부다.
  const dragRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null)

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = scrollRef.current
    if (!zoomed || !box) return
    dragRef.current = { x: event.clientX, y: event.clientY, left: box.scrollLeft, top: box.scrollTop }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = dragRef.current
    const box = scrollRef.current
    if (!start || !box) return
    box.scrollLeft = start.left - (event.clientX - start.x)
    box.scrollTop = start.top - (event.clientY - start.y)
  }

  const handlePointerUp = () => {
    dragRef.current = null
  }
```

(2) 여는 곳과 넘기는 곳에서 화면 맞춤으로 되돌린다.

```tsx
  useEffect(() => {
    if (isOpen) {
      setIndex(startIndex)
      setZoomed(false)
    }
  }, [isOpen, startIndex])

  // …

  const go = (step: number) => {
    setZoomed(false)
    setIndex((prev) => (prev + step + images.length) % images.length)
  }
```

(3) 사진을 담은 상자와 사진을 바꾼다.

```tsx
          <div
            ref={scrollRef}
            data-testid="photo-viewer-backdrop"
            onClick={onClose}
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
                setZoomed((prev) => !prev)
              }}
              className={cn(
                'm-auto select-none',
                zoomed ? 'max-w-none cursor-zoom-out' : 'max-h-full max-w-full cursor-zoom-in object-contain'
              )}
            />
          </div>
```

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm test src/components/photo-viewer/PhotoViewer.test.tsx
```
기대: 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add src/components/photo-viewer
git commit -m "feat(web): 사진 확대창에 실제 크기 보기를 더한다 (#904)"
```

---

### Task 3: 웹 상품 상세에 붙인다

**Files:**
- Modify: `src/features/product-detail/components/MainImage.tsx`
- Test: `src/features/product-detail/components/MainImage.test.tsx` (이어 쓴다)

**Interfaces:**
- Consumes: `PhotoViewer` (Task 1·2)
- Produces: 없음 (화면에만 붙인다)

- [ ] **Step 1: 실패하는 시험을 이어 쓴다**

`MainImage.test.tsx` 맨 아래에 붙인다. 파일 맨 위 import 에 `fireEvent` 를 더한다
(`import { fireEvent, render, screen } from '@/test/render'` 가 아니라 `@testing-library/react` 에서 가져온다 —
`@/test/render` 는 `render` 만 내보낸다).

```tsx
// 파일 맨 위 import 에 더한다
import { fireEvent } from '@testing-library/react'

describe('사진 확대창', () => {
  // ⚠️ Swiper 는 loop 를 쓰면 같은 사진을 여러 벌 그린다. 첫 번째 것을 누른다.
  it('사진을 누르면 확대창이 열린다', () => {
    render(
      <MainImage
        mainImageUrl={IMAGES[0]}
        subImageUrls={IMAGES.slice(1)}
        title="캣타워"
        tradeStatus={null}
        productTypeName="판매상품"
      />
    )

    fireEvent.click(screen.getAllByAltText('캣타워 - 1')[0])

    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument()
  })

  it('처음에는 확대창이 닫혀 있다', () => {
    render(
      <MainImage
        mainImageUrl={IMAGES[0]}
        subImageUrls={IMAGES.slice(1)}
        title="캣타워"
        tradeStatus={null}
        productTypeName="판매상품"
      />
    )

    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm test src/features/product-detail/components/MainImage.test.tsx
```
기대: 「사진을 누르면 확대창이 열린다」가 닫기 단추를 못 찾아 실패.

- [ ] **Step 3: `MainImage` 에 확대창을 붙인다**

(1) `Slide` 가 눌림을 받게 한다. `SlideProps` 와 `<img>` 를 고친다.

```tsx
interface SlideProps {
  imageUrl: string
  title: string
  index: number
  /** 없으면 눌러도 아무 일이 안 일어난다 — 사진이 하나도 없어 자리표시자만 그릴 때다 */
  onOpen?: (index: number) => void
}

function Slide({ imageUrl, title, index, onOpen }: SlideProps) {
  // … getSrc·getSrcSet·handleImgRef 는 그대로 …

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={handleImgRef}
      src={getSrc()}
      srcSet={getSrcSet()}
      sizes={IMAGE_SIZES.mainImage}
      alt={`${title} - ${index + 1}`}
      fetchPriority={index === 0 ? 'high' : 'auto'}
      loading={index === 0 ? 'eager' : 'lazy'}
      onClick={onOpen ? () => onOpen(index) : undefined}
      className={cn('absolute inset-0 h-full w-full object-cover', onOpen && 'cursor-zoom-in')}
      onError={() => {
        if (imgErrorStep < 2) {
          setImgErrorStep((prev) => prev + 1)
        }
      }}
    />
  )
}
```

(2) 확대창을 들여오고 상태를 둔다. import 에 더한다.

```tsx
import PhotoViewer from '@/components/photo-viewer/PhotoViewer'
```

`MainImage` 안, `const [nextEl, setNextEl] = useState…` 아래에 더한다.

```tsx
  // 확대창. 누른 사진에서 시작한다.
  //
  // ⚠️ Swiper 가 눌림을 가려 준다 — 끌고 나서 손을 떼면 click 이 생기지 않는다
  //    (preventClicks 가 기본으로 켜져 있다). 그래서 「옆으로 넘기려다 확대창이 뜨는」
  //    일은 생기지 않는다. 실기기에서 한 번 확인할 것.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
```

(3) 슬라이드에 손잡이를 넘기고, 맨 끝에 확대창을 그린다.

```tsx
            <Slide
              imageUrl={imageUrl}
              title={title}
              index={index}
              onOpen={images.length > 0 ? setViewerIndex : undefined}
            />
```

⚠️ **사진이 하나도 없으면 확대창을 안 연다.** 그때 `slides` 에 든 것은 자리표시자
(`/images/placeholder-800.webp`)라 띄울 것이 없다. 게다가 `toResizedWebpUrl` 이
`…placeholder-800_800.webp` 라는 없는 주소를 만든다.

```tsx
      {/* 확대창은 화면을 덮으므로 상태 배지 아래(마지막)에 둔다.
          자리표시자가 아니라 **진짜 사진들**(images)을 넘긴다 */}
      <PhotoViewer
        images={images}
        startIndex={viewerIndex ?? 0}
        isOpen={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
        alt={title}
      />
```

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm test src/features/product-detail/components/MainImage.test.tsx
```
기대: 전부 PASS(기존 시험 포함).

- [ ] **Step 5: 커밋**

```bash
git add src/features/product-detail/components/MainImage.tsx src/features/product-detail/components/MainImage.test.tsx
git commit -m "feat(web): 상품 상세 사진을 눌러 크게 본다 (#904)"
```

---

### Task 4: 앱 확대창 뼈대 (열기·닫기·여러 장)

**Files:**
- Create: `mobile/components/photo-viewer/photo-viewer.tsx`
- Test: `mobile/components/photo-viewer/photo-viewer.test.tsx`

**Interfaces:**
- Consumes: `colors` — `@/constants/colors`
- Produces:
  ```ts
  interface PhotoViewerProps {
    images: string[]
    startIndex?: number
    visible: boolean
    onClose: () => void
  }
  export function PhotoViewer(props: PhotoViewerProps): React.ReactElement
  export const PAGER_TEST_ID = 'photo-viewer-pager'
  ```

- [ ] **Step 1: 실패하는 시험을 쓴다**

`mobile/components/photo-viewer/photo-viewer.test.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { PAGER_TEST_ID, PhotoViewer } from './photo-viewer';

// 앱 사진 확대창(#904).
//
// ⚠️ render·fireEvent 는 기다려야 한다(mobile/AGENTS.md).
//
// ⚠️ 이 시험이 **안 덮는 것**: 손가락으로 넓히는 배율, 부드러움, 안드로이드 뒤로가기의
//    진짜 동작. 배율은 손가락 쪽(UI 쓰레드)에 있어 여기서 읽을 수 없다.
//    **실기기로 봐야 한다.**

const IMAGES = ['https://cdn/a.webp', 'https://cdn/b.webp'];

it('안 보일 때는 사진을 안 그린다', async () => {
  await render(<PhotoViewer images={IMAGES} visible={false} onClose={jest.fn()} />);

  expect(screen.queryByTestId(PAGER_TEST_ID)).toBeNull();
});

it('보이면 사진을 그린다', async () => {
  await render(<PhotoViewer images={IMAGES} visible onClose={jest.fn()} />);

  expect(screen.getByTestId(PAGER_TEST_ID)).toBeTruthy();
});

it('닫기 단추를 누르면 닫힌다고 알린다', async () => {
  const 닫힘 = jest.fn();
  await render(<PhotoViewer images={IMAGES} visible onClose={닫힘} />);

  await fireEvent.press(screen.getByLabelText('닫기'));

  expect(닫힘).toHaveBeenCalledTimes(1);
});

it('뒤로가기로 닫힌다고 알린다', async () => {
  const 닫힘 = jest.fn();
  await render(<PhotoViewer images={IMAGES} visible onClose={닫힘} />);

  // 안드로이드 뒤로가기는 Modal 에 requestClose 로 들어온다.
  await fireEvent(screen.getByTestId('photo-viewer-modal'), 'requestClose');

  expect(닫힘).toHaveBeenCalledTimes(1);
});

it('여러 장이면 몇 번째인지 보여준다', async () => {
  await render(<PhotoViewer images={IMAGES} startIndex={1} visible onClose={jest.fn()} />);

  expect(screen.getByText('2 / 2')).toBeTruthy();
});

it('한 장이면 번호를 안 보여준다', async () => {
  await render(<PhotoViewer images={[IMAGES[0]]} visible onClose={jest.fn()} />);

  expect(screen.queryByText('1 / 1')).toBeNull();
});
```

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
cd /Users/osejin/Desktop/cuddle-market && npx jest --config mobile/package.json mobile/components/photo-viewer 2>&1 | tail -20
```
(안 되면 `pnpm gate:mobile` 로 통째로 돌려도 된다. ⚠️ `cd mobile` 하고 루트 명령을 치지 말 것.)
기대: `Cannot find module './photo-viewer'` 로 실패.

- [ ] **Step 3: 확대창을 만든다 (제스처는 다음 과제)**

`mobile/components/photo-viewer/photo-viewer.tsx`

```tsx
import { Image } from 'expo-image';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { colors } from '@/constants/colors';

// 앱 사진 확대창(#904). 화면을 덮고 **잘리지 않게**(contain) 보여준다.
//
// ⚠️ 안드로이드에서 Modal 안은 별개의 창이라, 바깥(app/_layout.tsx)에 씌운
//    GestureHandlerRootView 가 여기까지 닿지 않는다. 다시 감싸지 않으면 **오류 없이
//    조용히 안 끌린다**(bottom-sheet.tsx 에 같은 함정이 적혀 있다).
//
// ⚠️ 넓힐수록 뭉갠다 — 올라온 사진이 800px 뿐이라 그렇다. 확대는 「더 선명해지는」 것이
//    아니라 「잘려 있던 자리를 보고, 뭉개짐을 감수하고 크게 보는」 것이다.

export const PAGER_TEST_ID = 'photo-viewer-pager';

interface PhotoViewerProps {
  images: string[];
  startIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export function PhotoViewer({ images, startIndex = 0, visible, onClose }: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(startIndex);

  // 열 때마다 누른 사진에서 시작한다.
  useEffect(() => {
    if (visible) setIndex(startIndex);
  }, [visible, startIndex]);

  return (
    <Modal
      testID="photo-viewer-modal"
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <FlatList
            testID={PAGER_TEST_ID}
            data={images}
            horizontal
            pagingEnabled
            initialScrollIndex={startIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            onMomentumScrollEnd={(event) =>
              setIndex(Math.round(event.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item }) => (
              <View style={{ width, height }}>
                <Image source={{ uri: item }} style={{ width, height }} contentFit="contain" />
              </View>
            )}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            onPress={onClose}
            style={styles.close}
            hitSlop={12}
          >
            <X size={28} color={colors.surface} />
          </Pressable>

          {images.length > 1 ? (
            <View style={styles.counter} pointerEvents="none">
              <Text style={styles.counterText}>
                {index + 1} / {images.length}
              </Text>
            </View>
          ) : null}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: '#000000' },
  close: { position: 'absolute', top: 44, right: 12, padding: 8 },
  counter: { position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center' },
  counterText: { color: colors.surface, fontSize: 14 },
});
```

`lucide-react-native` 는 이미 들어 있고 `X` 아이콘도 이미 쓰고 있다
(`mobile/components/ui/app-menu-overlay.tsx:2`). **새로 넣는 것은 없다.**

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm gate:mobile
```
기대: 타입체크·lint·시험 전부 통과.

- [ ] **Step 5: 커밋**

```bash
git add mobile/components/photo-viewer
git commit -m "feat(app): 사진 확대창 뼈대 (#904)"
```

---

### Task 5: 앱 확대창 — 핀치·더블탭·끌기

**Files:**
- Modify: `mobile/components/photo-viewer/photo-viewer.tsx`
- Test: `mobile/components/photo-viewer/photo-viewer.test.tsx` (이어 쓴다)

**Interfaces:**
- Consumes: Task 4 의 `PhotoViewer` · `PAGER_TEST_ID`
- Produces: `export const PINCH_TEST_ID = 'photo-viewer-pinch'` — 시험에서 제스처를 집는 이름

**넓힐 때 좌우 넘기기를 꺼야 하는 이유** — 넓힌 상태의 끌기는 「사진 움직이기」다. 넘기기가 켜져 있으면 둘이 다투어 사진이 옆으로 튄다.

- [ ] **Step 1: 실패하는 시험을 이어 쓴다**

```tsx
// 파일 맨 위 import 에 더한다
import type { PinchGesture } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';

import { PAGER_TEST_ID, PINCH_TEST_ID, PhotoViewer } from './photo-viewer';

// ⚠️ **배율 자체는 여기서 못 본다.** 배율은 손가락 쪽(UI 쓰레드)의 값이라
//    자바스크립트 쪽에서 읽히지 않는다. 대신 **결과**를 본다 —
//    「넓히면 좌우 넘기기가 꺼지는가」. 진짜 배율과 부드러움은 실기기로 본다.
function 넓힌다(배율: number) {
  fireGestureHandler<PinchGesture>(getByGestureTestId(PINCH_TEST_ID), [
    { scale: 1 },
    { scale: 배율 },
    // 5 = 손을 뗀 상태(END)
    { state: 5, scale: 배율 },
  ]);
}

it('처음에는 좌우로 넘길 수 있다', async () => {
  await render(<PhotoViewer images={IMAGES} visible onClose={jest.fn()} />);

  expect(screen.getByTestId(PAGER_TEST_ID).props.scrollEnabled).toBe(true);
});

it('넓히면 좌우 넘기기가 꺼진다', async () => {
  await render(<PhotoViewer images={IMAGES} visible onClose={jest.fn()} />);

  넓힌다(2);

  await waitFor(() => {
    expect(screen.getByTestId(PAGER_TEST_ID).props.scrollEnabled).toBe(false);
  });
});

it('다시 줄이면 좌우 넘기기가 켜진다', async () => {
  await render(<PhotoViewer images={IMAGES} visible onClose={jest.fn()} />);

  넓힌다(2);
  넓힌다(1);

  await waitFor(() => {
    expect(screen.getByTestId(PAGER_TEST_ID).props.scrollEnabled).toBe(true);
  });
});
```

⚠️ `waitFor` 를 import 에 더한다(`import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'`).
제스처가 알려 주는 값은 **한 박자 뒤에** 온다(`runOnJS` 가 건네주는 데 한 번 쉰다).

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm gate:mobile
```
기대: `PINCH_TEST_ID` 가 없다며 실패.

- [ ] **Step 3: 넓히는 조각을 만들어 끼운다**

`photo-viewer.tsx` 를 고친다.

(1) import 를 더한다.

```tsx
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
```

(2) 위쪽에 값과 조각을 더한다.

```tsx
export const PINCH_TEST_ID = 'photo-viewer-pinch';

/** 넓힐 수 있는 한계. 올라온 사진이 800px 뿐이라 더 가면 뭉개짐만 는다 */
const MAX_SCALE = 3;
/** 두 번 톡톡 쳤을 때의 배율 */
const DOUBLE_TAP_SCALE = 2;

interface ZoomablePhotoProps {
  uri: string;
  width: number;
  height: number;
  /** 넓힌 상태가 바뀌면 알린다. 좌우 넘기기를 켜고 끄는 데 쓴다 */
  onZoomChange: (zoomed: boolean) => void;
}

// 사진 한 장. 넓히고(핀치) · 두 번 쳐서 키우고(더블탭) · 끌어서 움직인다(팬).
//
// ⚠️ 끌기는 **넓힌 상태에서만** 듣는다. 1배일 때 끌면 좌우 넘기기가 해야 할 일이다.
function ZoomablePhoto({ uri, width, height, onZoomChange }: ZoomablePhotoProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    // 시험에서 이 제스처를 집어 흔들어 보려고 붙인 이름이다(photo-viewer.test.tsx).
    .withTestId(PINCH_TEST_ID)
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        // 제자리로 돌려놓는다 — 1배인데 사진이 옆으로 밀려 있으면 이상하다.
        x.value = withTiming(0);
        y.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
      runOnJS(onZoomChange)(scale.value > 1);
    });

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value <= 1) return;
      x.value = savedX.value + event.translationX;
      y.value = savedY.value + event.translationY;
    })
    .onEnd(() => {
      savedX.value = x.value;
      savedY.value = y.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scale.value > 1 ? 1 : DOUBLE_TAP_SCALE;
      scale.value = withTiming(next);
      savedScale.value = next;
      if (next === 1) {
        x.value = withTiming(0);
        y.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
      runOnJS(onZoomChange)(next > 1);
    });

  // 핀치는 끌기·더블탭과 **같이** 돈다(두 손가락과 한 손가락은 겨룰 일이 없다).
  // 끌기와 더블탭은 서로 겨루므로 하나만 이기게 둔다.
  const gesture = Gesture.Simultaneous(Gesture.Exclusive(doubleTap, pan), pinch);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ width, height }, style]}>
        <Image source={{ uri }} style={{ width, height }} contentFit="contain" />
      </Animated.View>
    </GestureDetector>
  );
}
```

(3) `PhotoViewer` 안에서 상태를 더하고 `renderItem` 을 바꾼다.

```tsx
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (visible) {
      setIndex(startIndex);
      setZoomed(false);
    }
  }, [visible, startIndex]);
```

```tsx
            scrollEnabled={!zoomed}
            renderItem={({ item }) => (
              <ZoomablePhoto uri={item} width={width} height={height} onZoomChange={setZoomed} />
            )}
```

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm gate:mobile
```
기대: 전부 통과.

- [ ] **Step 5: 커밋**

```bash
git add mobile/components/photo-viewer
git commit -m "feat(app): 사진 확대창에 핀치·더블탭·끌기를 더한다 (#904)"
```

---

### Task 6: 앱 상품 상세에 붙인다

**Files:**
- Modify: `mobile/components/product-detail/image-carousel.tsx`
- Test: `mobile/components/product-detail/image-carousel.test.tsx` (없으면 새로 만든다)

**Interfaces:**
- Consumes: `PhotoViewer` (Task 4·5)
- Produces: 없음

- [ ] **Step 1: 실패하는 시험을 쓴다**

`mobile/components/product-detail/image-carousel.test.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { ImageCarousel } from './image-carousel';

// 상세 대표 사진에 확대창이 붙는다(#904).
//
// ⚠️ render·fireEvent 는 기다려야 한다(mobile/AGENTS.md).

const IMAGES = ['https://cdn/a.webp', 'https://cdn/b.webp'];

it('처음에는 확대창이 닫혀 있다', async () => {
  await render(
    <ImageCarousel mainImageUrl={IMAGES[0]} subImageUrls={[IMAGES[1]]} tradeStatus={null} productType="판매상품" />
  );

  expect(screen.queryByLabelText('닫기')).toBeNull();
});

it('사진을 누르면 확대창이 열린다', async () => {
  await render(
    <ImageCarousel mainImageUrl={IMAGES[0]} subImageUrls={[IMAGES[1]]} tradeStatus={null} productType="판매상품" />
  );

  await fireEvent.press(screen.getByTestId('detail-photo-0'));

  expect(screen.getByLabelText('닫기')).toBeTruthy();
});
```

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm gate:mobile
```
기대: `detail-photo-0` 을 못 찾아 실패.

- [ ] **Step 3: 캐러셀에 확대창을 붙인다**

(1) import 와 상태를 더한다.

```tsx
import { Pressable } from 'react-native'; // 기존 react-native import 줄에 더한다

import { PhotoViewer } from '@/components/photo-viewer/photo-viewer';
```

```tsx
  // 확대창. 누른 사진에서 시작한다.
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
```

(2) `renderItem` 의 사진을 눌리게 감싼다. 못 불러온 자리(회색 상자)는 그대로 둔다 —
띄울 사진이 없다.

```tsx
        renderItem={({ item, index: i }) =>
          failedUrls.includes(item) ? (
            <View style={{ width, height: width, backgroundColor: colors.outlineVariant }} />
          ) : (
            <Pressable testID={`detail-photo-${i}`} onPress={() => setViewerIndex(i)}>
              <Image
                source={{ uri: item }}
                style={{ width, height: width }}
                contentFit="cover"
                onError={() => setFailedUrls((prev) => [...prev, item])}
              />
            </Pressable>
          )
        }
```

(3) 맨 끝(`</View>` 바로 앞)에 확대창을 그린다.

```tsx
      <PhotoViewer
        images={images}
        startIndex={viewerIndex ?? 0}
        visible={viewerIndex !== null}
        onClose={() => setViewerIndex(null)}
      />
```

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm gate:mobile
```
기대: 전부 통과.

- [ ] **Step 5: 커밋**

```bash
git add mobile/components/product-detail
git commit -m "feat(app): 상품 상세 사진을 눌러 크게 본다 (#904)"
```

---

### Task 7: 1단계 게이트 · 눈 확인 · 브라우저 확대 추정 검증

시험이 못 덮는 자리를 사람이 본다. **여기서 설계의 추정 하나가 갈린다.**

**Files:**
- Modify: `src/components/photo-viewer/PhotoViewer.tsx` (아래 ①의 결과에 따라 확대 코드를 뺄 수도 있다)
- Modify: `docs/superpowers/specs/2026-08-13-photo-viewer-design.md` (확인 결과를 적는다)

- [ ] **Step 1: 게이트를 둘 다 돌린다**

```bash
pnpm gate
pnpm gate:mobile
```
기대: 둘 다 통과. ⚠️ 경고는 36건을 넘으면 막힌다.

- [ ] **Step 2: 웹을 브라우저로 본다**

```bash
pnpm dev   # 이미 떠 있으면 그대로 쓴다
```

```
① 데스크탑에서 확대창을 열고 ⌘+휠(또는 Ctrl+휠)로 브라우저 확대를 해본다
   → 사진이 커지면  : 우리 확대 코드(Task 2)를 **뺀다.** 브라우저가 하는 일을 두 벌 만들 이유가 없다
   → 안 커지면      : 설계의 추정이 맞다. 그대로 둔다
   어느 쪽이든 결과를 설계 문서 「넓혀 보기 규칙」 밑에 한 줄로 적는다

② 세로로 긴 사진(예: 상품 73번)을 열어 **위아래가 안 잘리는지** 본다
③ 사진을 눌러 실제 크기로 갔다가 다시 눌러 돌아오는지
④ 실제 크기에서 끌어서 구석까지 갈 수 있는지
⑤ ESC · 검은 자리 누르기 · 닫기 단추 — 셋 다 닫히는지
⑥ 여러 장짜리 상품에서 옆으로 넘기고, 번호(2 / 3)가 맞는지
⑦ **옆으로 쓸어 넘기려 했는데 확대창이 뜨지는 않는지** (Swiper 가 막아 준다고 봤지만 확인 전이다)
```

- [ ] **Step 3: 앱을 실기기로 본다**

```
① 핀치로 넓혔다 줄였다 — 1배 밑으로 내려가면 튕겨 돌아오는지
② 두 번 톡톡 쳐서 2배 ↔ 1배
③ 넓힌 상태에서 끌어 사진을 움직일 수 있는지
④ 넓힌 상태에서는 좌우로 안 넘어가고, 1배로 줄이면 넘어가는지
⑤ 안드로이드 뒤로가기로 확대창만 닫히고 **상품 상세에 그대로 있는지**
⑥ 세로로 긴 사진이 안 잘리는지
```

⚠️ **③④가 안 먹으면 `GestureHandlerRootView` 를 Modal 안에 다시 씌웠는지부터 본다.** 오류가 안 나고 조용히 안 끌리는 것이 이 함정의 증상이다.

- [ ] **Step 4: 확인 결과를 문서에 적고 커밋**

```bash
git add docs/superpowers/specs/2026-08-13-photo-viewer-design.md src/components/photo-viewer
git commit -m "docs: 브라우저 확대가 확대창 안에서 먹는지 확인한 결과를 적는다 (#904)"
```

- [ ] **Step 5: PR 을 올린다**

```bash
git push -u origin feat/904--photo-viewer
```
PR 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 를 **열어서** 그대로 따른다.
⚠️ 관련 이슈는 목록 항목으로 적는다 — `- Close #904` (1단계에서는 아직 닫지 않으므로 `- 관련 #904`).

---

# 2단계 — 채팅 (PR 2)

### Task 8: 웹 채팅 사진에 붙인다

**Files:**
- Modify: `src/features/chatting-page/components/ChatLog.tsx` (`ChatImageMessage` — 34번째 줄부터)
- Test: `src/features/chatting-page/components/ChatLog.test.tsx` (없으면 새로 만든다)

**Interfaces:**
- Consumes: `PhotoViewer` (Task 1·2)
- Produces: 없음

- [ ] **Step 1: 실패하는 시험을 쓴다**

`src/features/chatting-page/components/ChatLog.test.tsx` 를 새로 만든다.
⚠️ `ChatLog` 는 **이름 붙은 내보내기**다(`export function ChatLog`, 87번째 줄) — `default` 가 아니다.

```tsx
import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { render } from '@/test/render'
import type { Message } from '@/types/chat'

import { ChatLog } from './ChatLog'

// 채팅 사진에 확대창이 붙는다(#904).
//
// ⚠️ 사진 메시지는 content 가 비어 있고 imageUrl 에만 값이 있다.
//    사진의 alt 는 보낸 사람 이름이다(ChatLog 의 ChatImageMessage).

function 사진메시지(덮어쓰기: Partial<Message> = {}): Message {
  return {
    messageId: 1,
    senderId: 9,
    senderNickname: '홍길동',
    messageType: 'IMAGE',
    content: '',
    imageUrl: 'https://cdn/a.jpg',
    isBlocked: false,
    blockReason: null,
    createdAt: '2026-08-13T07:12:42',
    isMine: false,
    ...덮어쓰기,
  }
}

describe('채팅 사진 확대창', () => {
  it('처음에는 닫혀 있다', () => {
    render(<ChatLog isLoadingMessages={false} errorMessages={null} roomMessages={[사진메시지()]} />)

    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
  })

  it('사진 말풍선을 누르면 확대창이 열린다', () => {
    render(<ChatLog isLoadingMessages={false} errorMessages={null} roomMessages={[사진메시지()]} />)

    fireEvent.click(screen.getByAltText('홍길동'))

    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm test src/features/chatting-page
```
기대: 닫기 단추를 못 찾아 실패.

- [ ] **Step 3: `ChatImageMessage` 를 눌리게 한다**

```tsx
function ChatImageMessage({ imageUrl, alt }: { imageUrl?: string; alt: string }) {
  const [imgError, setImgError] = useState(false)
  const [usePlaceholder, setUsePlaceholder] = useState(false)
  // 확대창. 채팅 사진은 한 장씩이라 누른 것만 띄운다.
  const [viewerOpen, setViewerOpen] = useState(false)

  // … handleImageError · getImageSrc 는 그대로 …

  return (
    <div className="relative aspect-square w-48 shrink-0 overflow-hidden rounded-lg md:w-72">
      <Image
        src={getImageSrc()}
        loader={imgError || usePlaceholder || !imageUrl ? undefined : imageLoader}
        sizes={IMAGE_SIZES.smallThumbnail}
        alt={alt}
        fill
        // … 남은 값들 그대로 …
        onClick={() => { if (imageUrl && !usePlaceholder) setViewerOpen(true) }}
        className="… 기존 class … cursor-zoom-in"
      />
      {imageUrl ? (
        <PhotoViewer
          images={[imageUrl]}
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          alt={alt}
        />
      ) : null}
    </div>
  )
}
```

⚠️ **못 불러온 사진(자리표시자)에는 확대창을 열지 않는다.** 띄울 것이 없다.
⚠️ 확대창은 `overflow-hidden` 인 상자 안에 있지만 `<dialog>` 는 브라우저가 맨 위 층에 올려서 잘리지 않는다. **1단계 Step 2 의 ①에서 이미 확인한 성질이다.**

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm test src/features/chatting-page
```

- [ ] **Step 5: 커밋**

```bash
git add src/features/chatting-page
git commit -m "feat(web): 채팅 사진을 눌러 크게 본다 (#904)"
```

---

### Task 9: 앱 채팅 사진에 붙인다

**Files:**
- Modify: `mobile/components/chat/message-bubble.tsx` (`ImageMessage` — 16번째 줄부터)
- Test: `mobile/components/chat/message-bubble.test.tsx` (이어 쓴다)

**Interfaces:**
- Consumes: `PhotoViewer` (Task 4·5)
- Produces: 없음

- [ ] **Step 1: 실패하는 시험을 이어 쓴다**

```tsx
it('사진 말풍선을 누르면 확대창이 열린다', async () => {
  await render(
    <MessageBubble message={메시지({ messageType: 'IMAGE', content: '', imageUrl: 'https://cdn/a.webp' })} />
  );

  await fireEvent.press(screen.getByTestId('chat-photo'));

  expect(screen.getByLabelText('닫기')).toBeTruthy();
});
```

⚠️ 파일 맨 위 import 에 `fireEvent` 를 더한다.

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm gate:mobile
```

- [ ] **Step 3: `ImageMessage` 를 눌리게 한다**

```tsx
function ImageMessage({ uri, mine }: { uri: string | null; mine: boolean }) {
  const [failed, setFailed] = useState(false);
  // 확대창. 채팅 사진은 한 장씩이라 누른 것만 띄운다.
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <View style={[styles.photo, mine ? styles.photoMine : styles.photoTheirs]}>
      {uri && !failed ? (
        <>
          <Pressable testID="chat-photo" onPress={() => setViewerOpen(true)} style={styles.photoImage}>
            <Image
              source={{ uri }}
              style={styles.photoImage}
              contentFit="cover"
              // 읽어 주는 이름이 없으면 화면 낭독기가 「그림」이라고만 읽는다.
              accessibilityLabel={mine ? '내가 보낸 사진' : '받은 사진'}
              onError={() => setFailed(true)}
            />
          </Pressable>
          <PhotoViewer images={[uri]} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
        </>
      ) : (
        // 못 불러온 자리 — 기존 그대로. 띄울 사진이 없으니 누를 수도 없다.
        <View style={styles.photoFallback}>
          <Text style={styles.photoFallbackText}>사진을 불러오지 못했어요</Text>
        </View>
      )}
    </View>
  );
}
```

⚠️ `Pressable` 을 `react-native` import 줄에 더한다. `PhotoViewer` 는 `@/components/photo-viewer/photo-viewer` 에서 가져온다.

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm gate:mobile
```

- [ ] **Step 5: 커밋하고 2단계 PR 을 올린다**

```bash
git add mobile/components/chat
git commit -m "feat(app): 채팅 사진을 눌러 크게 본다 (#904)"
git push
```

⚠️ **여기서 사용자 눈 확인을 받는다** — 채팅방에서 사진을 눌러 열고, 뒤로가기로 닫았을 때 **채팅방에 그대로 있는지**(방을 나가면 안 된다).

---

# 3단계 — 커뮤니티 (PR 3)

### Task 10: 웹 커뮤니티 본문 사진에 붙인다

**Files:**
- Modify: `src/features/community/components/markdown/MdPreview.tsx`
- Modify: `src/features/community/CommunityDetail.tsx:203`
- Test: `src/features/community/components/markdown/MdPreview.test.tsx` (없으면 새로 만든다)

**Interfaces:**
- Consumes: `PhotoViewer` (Task 1·2)
- Produces: `MdPreview` 가 값을 하나 더 받는다 — `enablePhotoViewer?: boolean` (기본 `false`)

⚠️ **`MdPreview` 는 글 쓰는 화면의 미리보기에도 쓰인다**(`Markdown.tsx:137`). 기본을 꺼 두고 상세 화면에서만 켠다. 안 그러면 글을 쓰다가 미리보기 사진을 눌렀을 때 확대창이 뜬다.

- [ ] **Step 1: 실패하는 시험을 쓴다**

```tsx
import { describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'

import { render } from '@/test/render'

import MdPreview from './MdPreview'

const 본문 = '![고양이](https://cdn/a.jpg)'

it('켜 두면 본문 사진을 눌러 확대창을 연다', () => {
  render(<MdPreview value={본문} enablePhotoViewer />)

  fireEvent.click(screen.getByAltText('고양이'))

  expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument()
})

it('기본값(글쓰기 미리보기)에서는 안 열린다', () => {
  render(<MdPreview value={본문} />)

  fireEvent.click(screen.getByAltText('고양이'))

  expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument()
})
```

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm test src/features/community
```

- [ ] **Step 3: `MdPreview` 에 확대창을 붙인다**

⚠️ `MdPreview` 는 `'use client'` 가 없는 조각이다 — `useState` 를 쓰려면 맨 위에 붙여야 한다.
`height` 는 지우지 말 것(글쓰기 미리보기가 쓴다).

```tsx
// 받는 값에 더한다. height 는 원래 있던 것이다
interface MdPreviewProps {
  value: string
  height?: number
  className?: string
  /**
   * 본문 사진을 눌러 확대창을 열지. **기본은 끔.**
   *
   * ⚠️ 이 조각은 글 쓰는 화면의 미리보기에도 쓰인다(Markdown.tsx:137).
   *    거기서 켜면 글을 쓰다가 사진을 눌렀을 때 확대창이 뜬다. 상세 화면에서만 켠다.
   */
  enablePhotoViewer?: boolean
}
```

```tsx
  // 본문에 나온 사진들. 확대창에서 옆으로 넘길 수 있게 모아 둔다.
  const [viewerSrc, setViewerSrc] = useState<string | null>(null)
```

```tsx
          img: (p) => (
            <img
              {...p}
              onClick={enablePhotoViewer && p.src ? () => setViewerSrc(String(p.src)) : undefined}
              className={cn('my-2 h-auto w-full rounded-lg md:max-w-[50%]', enablePhotoViewer && 'cursor-zoom-in')}
            />
          ),
```

그리고 마지막에 확대창을 그린다.

```tsx
      {enablePhotoViewer && viewerSrc ? (
        <PhotoViewer images={[viewerSrc]} isOpen onClose={() => setViewerSrc(null)} alt="본문 사진" />
      ) : null}
```

`CommunityDetail.tsx:203` 을 고친다.

```tsx
              <MdPreview value={data.content} className="p-0" enablePhotoViewer />
```

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm test src/features/community
```

- [ ] **Step 5: 커밋**

```bash
git add src/features/community
git commit -m "feat(web): 커뮤니티 본문 사진을 눌러 크게 본다 (#904)"
```

---

### Task 11: 앱 커뮤니티 본문 사진에 붙인다

**Files:**
- Modify: `mobile/components/community/post-body.tsx` (`PostImage` — 106번째 줄부터)
- Test: `mobile/components/community/post-body.test.tsx` (이어 쓴다)

**Interfaces:**
- Consumes: `PhotoViewer` (Task 4·5)
- Produces: 없음

- [ ] **Step 1: 실패하는 시험을 이어 쓴다**

```tsx
it('본문 사진을 누르면 확대창이 열린다', async () => {
  await render(<PostBody content={'![고양이](https://cdn/a.jpg)'} />);

  // 사진마다 같은 이름을 쓴다 — 그리개(PostRenderer)가 번호를 넘겨 주지 않아서다.
  await fireEvent.press(screen.getAllByTestId('post-photo')[0]);

  expect(screen.getByLabelText('닫기')).toBeTruthy();
});
```

`PostBody` 가 받는 값은 `content: string` 하나다(`post-body.tsx:23-25`).

- [ ] **Step 2: 시험이 실패하는지 본다**

```bash
pnpm gate:mobile
```

- [ ] **Step 3: `PostImage` 를 눌리게 한다**

```tsx
function PostImage({ uri, alt, style }: { uri: string; alt?: string; style?: ImageStyle }) {
  // … 기존 크기 재는 코드 그대로 …
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <Pressable testID="post-photo" onPress={() => setViewerOpen(true)}>
        <Image source={{ uri }} /* … 기존 값 그대로 … */ />
      </Pressable>
      <PhotoViewer images={[uri]} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
    </>
  );
}
```

⚠️ **사진마다 이름이 같다**(`post-photo`). 그리개(`PostRenderer.image`, 128번째 줄)가 번호를
넘겨 주지 않아서다 — `this.getKey()` 는 리액트 key 로만 쓰이고 조각 안에서는 못 본다.
시험은 `getAllByTestId('post-photo')[0]` 으로 집는다.

- [ ] **Step 4: 시험이 통과하는지 본다**

```bash
pnpm gate:mobile
```

- [ ] **Step 5: 커밋하고 3단계 PR 을 올린다**

```bash
git add mobile/components/community
git commit -m "feat(app): 커뮤니티 본문 사진을 눌러 크게 본다 (#904)"
git push
```

PR 본문에 `- Close #904` 를 넣는다(마지막 단계라 여기서 닫는다).

---

## 마지막에 남길 것

- [ ] 1600px 업로드는 **따로 이슈를 연다**(제목은 `feat:` 로 시작). 본문에 이번에 잰 것을 옮겨 적는다 —
      원본이 이미 800×1715 이고 `_1600` 은 403, 이미 올라간 사진은 소급이 안 된다는 것.
- [ ] 학습 로그(`~/Desktop/weekly-learning-log.md`)에 이번 바퀴를 적는다. 날짜는 `date` 로 요일을 확인한 뒤 쓴다.
