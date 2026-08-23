# 모바일 웹 더보기 메뉴를 드롭다운으로 — 구현 계획

> ✅ **다 끝났다 (2026-08-23).** 체크상자는 일이 끝난 뒤에 채웠다 — 진행 중에 못 채워
> 한동안 「빈칸 22개」로 남아 있었고, 나중에 읽는 사람이 안 한 일로 오해할 뻔했다.
>
> ```
> 과제 1  DropdownMenu 조각      → PR #1032   src/components/commons/DropdownMenu.tsx 315줄 · 짝 시험 316줄
> 과제 2  MyList 갈아 끼우기      → PR #1032   MyList.tsx:21 이 그 조각을 부른다
> 과제 3  쓰임 없어진 시트 걷기    → PR #1032   BottomSheet 흔적이 src 에 하나도 없다
> ```
>
> 그 뒤 **채팅방·프로필 ⋮ 도 같은 조각으로 옮겼다**(#1034 → PR #1036).
> 지금 이 조각을 쓰는 곳은 셋이다 — `MyList` · `ChatRoomInfo` · `ProfileData`.
>
> ⚠️ **계획 문서의 빈 체크상자는 「안 한 일」이라는 뜻이 아니다.** 판단하기 전에
> 코드를 열어 실제로 있는지 봐라. 위 셋은 전부 파일로 확인한 것이다.

> **에이전트에게:** 이 계획은 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans` 로 한 과제씩 진행한다. 단계는 체크상자(`- [ ]`)로 따라간다.

**목표:** 마이페이지 상품 카드의 ⋮ 메뉴를 「아래에서 올라오는 시트」에서 「단추에 붙는 드롭다운」으로 바꾼다.

**얼개:** 공통 조각 `DropdownMenu` 를 새로 만든다 — `ProfileData` 의 낱말(`role="menu"`), `SelectDropdown` 의 자리잡기(portal + `getBoundingClientRect`), `BottomSheet` 의 표식(`data-overlay-above`)·사건 막기를 한데 모은다. 그다음 `MyList` 만 갈아 끼우고, 쓰임이 없어진 `BottomSheet` 를 걷는다.

**기술:** Next.js App Router · React 19 · TypeScript · Tailwind v4 · vitest + React Testing Library(jsdom) · Playwright(이미 깔린 크롬)

**설계 문서:** `docs/superpowers/specs/2026-08-23-menu-dropdown-design.md`

## 전체에 걸리는 규칙

- **이슈 #1030.** 커밋 제목 끝에 `(#1030)` 을 단다.
- **브랜치 `refactor/1030--menu-dropdown`.** `develop`·`main` 에 직접 커밋 금지.
- **`npx prettier --write` 를 웹 파일에 돌리지 마라.** 관계없는 줄까지 다시 접힌다. 들여쓰기는 손으로 맞춘다.
- **린트 경고 상한 31.** 넘으면 `pnpm gate` 가 막힌다.
- **게이트 전에 dev 서버를 내린다.** `next build` 가 같은 `.next` 를 덮어써 핫리로드가 끊긴다.
  ```bash
  P=$(lsof -ti:3000 | head -1); [ -n "$P" ] && kill $P
  pnpm gate
  nohup pnpm dev > /tmp/dev.log 2>&1 &
  ```
- **브라우저로 잴 때는 이미 깔린 크롬을 쓴다** — `chromium.launch({ channel: 'chrome' })`. 스크립트는 **저장소 뿌리**에 두어야 `node_modules/playwright` 를 찾는다. 다 쓰면 지운다.
- **jsdom 이 못 잡는 것 셋:** 배치·잘림 · 캡처/버블 경합 · `fixed` 기준점. 이 셋은 반드시 크롬으로 본다.

---

## 파일 구조

| 파일 | 맡는 일 |
|---|---|
| `src/components/commons/DropdownMenu.tsx` | **새로.** 단추에 붙는 메뉴 하나. 자리잡기·표식·낱말·사건 막기·초점 되돌리기 |
| `src/components/commons/DropdownMenu.test.tsx` | **새로.** 위 조각의 계약을 지킨다 |
| `src/features/my-page/components/MyList.tsx` | **고침.** `BottomSheet` → `DropdownMenu` |
| `src/components/commons/BottomSheet.tsx` | **지움.** 쓰는 곳이 `MyList` 하나뿐이었다 |
| `src/components/commons/BottomSheet.test.tsx` | **지움.** 지킬 것은 `DropdownMenu.test.tsx` 로 옮긴다 |
| `src/app/globals.css` | **고침.** `bottom-sheet-rise` 블록(110~132줄) 제거 |

---

## 과제 1: `DropdownMenu` 조각

새 파일만 만든다. 아직 아무 화면도 안 바뀌므로 이 과제만으로 게이트가 초록이어야 한다.

**파일:**
- 만듦: `src/components/commons/DropdownMenu.tsx`
- 만듦: `src/components/commons/DropdownMenu.test.tsx`

**주고받는 것:**
- 쓰는 것: `OVERLAY_ABOVE_ATTR`·`Z_INDEX` (`@/constants/ui`) · `useOutsideClick` (`@/hooks/useOutsideClick`) · `cn` (`@/lib/utils/cn`)
- 내놓는 것:
  ```ts
  export function DropdownMenu(props: {
    isOpen: boolean
    onClose: () => void
    triggerRef: React.RefObject<HTMLElement | null>
    label: string
    children: React.ReactNode
  }): React.ReactPortal | null

  export function DropdownMenuItem(props: {
    onClick: (e: React.MouseEvent) => void
    tone?: 'default' | 'danger'
    children: React.ReactNode
  }): React.JSX.Element
  ```

- [x] **1단계: 떨어지는 시험을 먼저 쓴다**

`src/components/commons/DropdownMenu.test.tsx` 를 만든다.

```tsx
import Link from 'next/link'
import { useRef, useState } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { OVERLAY_ABOVE_ATTR } from '@/constants/ui'
import { render, screen } from '@/test/render'

import { DropdownMenu, DropdownMenuItem } from './DropdownMenu'

// 단추에 붙는 더보기 메뉴 (#1030).
//
// 시트에서 옮겨 온 계약을 여기서 지킨다 — ESC·바깥 눌러 닫기·「내가 위에 있다」 표식(#1003)·
// 링크 안에서 눌러도 링크가 안 눌리기(#793)·닫을 때 초점 되돌리기(#981).
//
// ⚠️ **자리(몇 픽셀에 그려지나)와 잘림은 여기서 못 본다.** jsdom 에는 배치가 없다.
//    그건 크롬으로 본다 — 과제 2.

function Harness({ isOpen = true, onClose = vi.fn() }: { isOpen?: boolean; onClose?: () => void }) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <div>
      <button type="button" ref={triggerRef} aria-label="상품 옵션 메뉴 열기">
        ⋮
      </button>
      <DropdownMenu isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} label="상품 메뉴">
        <DropdownMenuItem onClick={vi.fn()}>수정하기</DropdownMenuItem>
        <DropdownMenuItem tone="danger" onClick={vi.fn()}>
          삭제
        </DropdownMenuItem>
      </DropdownMenu>
    </div>
  )
}

describe('여닫기', () => {
  it('닫혀 있으면 아무것도 안 그린다', () => {
    render(<Harness isOpen={false} />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('열면 항목이 보인다', () => {
    render(<Harness />)
    expect(screen.getByRole('menuitem', { name: '수정하기' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '삭제' })).toBeInTheDocument()
  })

  it('ESC 를 누르면 닫는다', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Harness onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('바깥을 누르면 닫는다', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <div>
        <Harness onClose={onClose} />
        <span>바깥</span>
      </div>
    )

    await user.click(screen.getByText('바깥'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('겹쳐 열렸을 때 ESC 를 누가 먹는가 (#1003)', () => {
  // 마이페이지에서는 패널 → 이 메뉴 → 삭제 모달이 세 겹으로 쌓인다.
  // 바깥(패널)은 `[data-overlay-above]` 가 DOM 에 있는지로 「내 위에 뭐가 있나」를 가른다.
  // 표식을 안 달면 ESC 한 번에 메뉴와 패널이 **같이** 닫힌다.

  it('열려 있는 동안 「내가 위에 있다」는 표식을 단다', () => {
    render(<Harness />)
    expect(document.querySelector(`[${OVERLAY_ABOVE_ATTR}]`)).not.toBeNull()
  })

  it('닫히면 표식도 같이 사라진다', () => {
    render(<Harness isOpen={false} />)
    expect(document.querySelector(`[${OVERLAY_ABOVE_ATTR}]`)).toBeNull()
  })
})

describe('링크 안에서 열렸을 때 (#793)', () => {
  // 마이페이지 카드는 통째로 <Link> 다. portal 은 **DOM 에서만** body 로 나가고
  // 리액트 사건은 여전히 리액트 트리를 타고 올라간다. 막지 않으면 항목을 눌렀는데
  // 상세 페이지로 넘어간다.

  function LinkHarness({ onNavigate, onEdit }: { onNavigate: () => void; onEdit: (e: React.MouseEvent) => void }) {
    const triggerRef = useRef<HTMLButtonElement>(null)
    return (
      <Link href="/products/1" onClick={onNavigate}>
        카드
        <button type="button" ref={triggerRef} aria-label="상품 옵션 메뉴 열기">
          ⋮
        </button>
        <DropdownMenu isOpen onClose={vi.fn()} triggerRef={triggerRef} label="상품 메뉴">
          <DropdownMenuItem onClick={onEdit}>수정하기</DropdownMenuItem>
        </DropdownMenu>
      </Link>
    )
  }

  it('항목을 눌러도 바깥 링크가 안 눌린다', async () => {
    const onNavigate = vi.fn()
    const onEdit = vi.fn()
    const user = userEvent.setup()
    render(<LinkHarness onNavigate={onNavigate} onEdit={onEdit} />)

    await user.click(screen.getByRole('menuitem', { name: '수정하기' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
    // 여기서 1 이 나오면 메뉴를 고르는 대신 상세 페이지로 넘어간다
    expect(onNavigate).not.toHaveBeenCalled()
  })
})

describe('초점 (#981)', () => {
  it('닫으면 열기 전 자리로 초점을 되돌린다', async () => {
    function ToggleHarness() {
      const [open, setOpen] = useState(false)
      const triggerRef = useRef<HTMLButtonElement>(null)
      return (
        <div>
          <button type="button" ref={triggerRef} onClick={() => setOpen((p) => !p)} aria-label="상품 옵션 메뉴 열기">
            ⋮
          </button>
          <DropdownMenu isOpen={open} onClose={() => setOpen(false)} triggerRef={triggerRef} label="상품 메뉴">
            <DropdownMenuItem onClick={vi.fn()}>수정하기</DropdownMenuItem>
          </DropdownMenu>
        </div>
      )
    }

    const user = userEvent.setup()
    render(<ToggleHarness />)
    const trigger = screen.getByRole('button', { name: '상품 옵션 메뉴 열기' })

    await user.click(trigger)
    expect(screen.getByRole('menu')).toBeInTheDocument()

    // ⚠️ 초점을 메뉴 안으로 옮겨 둔다. 안 옮기면 단추를 누른 채 그대로라
    //    「되돌렸다」인지 「원래 거기 있었다」인지 못 가린다.
    screen.getByRole('menuitem', { name: '수정하기' }).focus()
    expect(document.activeElement).not.toBe(trigger)

    await user.keyboard('{Escape}')

    expect(document.activeElement).toBe(trigger)
  })
})

describe('항목', () => {
  it('누르면 그 항목의 일이 돈다', async () => {
    const onEdit = vi.fn()
    const user = userEvent.setup()
    const Wrapper = () => {
      const triggerRef = useRef<HTMLButtonElement>(null)
      return (
        <div>
          <button type="button" ref={triggerRef} aria-label="상품 옵션 메뉴 열기">
            ⋮
          </button>
          <DropdownMenu isOpen onClose={vi.fn()} triggerRef={triggerRef} label="상품 메뉴">
            <DropdownMenuItem onClick={onEdit}>수정하기</DropdownMenuItem>
          </DropdownMenu>
        </div>
      )
    }
    render(<Wrapper />)

    await user.click(screen.getByRole('menuitem', { name: '수정하기' }))

    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('위험한 항목은 색이 다르다', () => {
    render(<Harness />)
    expect(screen.getByRole('menuitem', { name: '삭제' })).toHaveClass('text-danger-500')
    expect(screen.getByRole('menuitem', { name: '수정하기' })).not.toHaveClass('text-danger-500')
  })
})
```

- [x] **2단계: 떨어지는 것을 확인한다**

```bash
npx vitest run src/components/commons/DropdownMenu.test.tsx
```

예상: `Failed to resolve import "./DropdownMenu"` 로 **떨어진다.**

- [x] **3단계: 조각을 만든다**

`src/components/commons/DropdownMenu.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
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

export function DropdownMenu({ isOpen, onClose, triggerRef, label, children }: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null)

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

  // 단추 자리에 맞춘다. 오른쪽 정렬이라 left 가 아니라 right 로 잰다.
  // 스크롤·크기바뀜에 따라 다시 잰다(SelectDropdown 과 같은 방식).
  useEffect(() => {
    if (!isOpen) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      setPosition({ top: rect.bottom + GAP_PX, right: window.innerWidth - rect.right })
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

  // 닫을 때 초점을 열기 전 자리로 되돌린다(#981).
  // 시트의 useFocusTrap 이 해 주던 일인데, 드롭다운은 모달이 아니라 가둠은 안 쓴다 —
  // 「탭 하면 닫히고 다음으로」가 드롭다운의 표준이다.
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !isOpen) triggerRef.current?.focus()
    wasOpen.current = isOpen
  }, [isOpen, triggerRef])

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
      className={cn('fixed', Z_INDEX.MODAL)}
      style={position}
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
    >
      <div
        ref={menuRef}
        role="menu"
        aria-label={label}
        className="border-outline-variant/60 flex min-w-40 flex-col overflow-hidden rounded-lg border bg-white shadow-md"
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
```

- [x] **4단계: 시험이 통과하는지 본다**

```bash
npx vitest run src/components/commons/DropdownMenu.test.tsx
```

예상: **9개 전부 통과.**

- [x] **5단계: 마커 검증 — 시험이 진짜로 지키는지 증명한다**

`DropdownMenu.tsx` 에서 표식 한 줄만 잠깐 지운다.

```tsx
// {...{ [OVERLAY_ABOVE_ATTR]: '' }}      ← 이 줄만 주석 처리
```

```bash
npx vitest run src/components/commons/DropdownMenu.test.tsx
```

예상: **「열려 있는 동안 「내가 위에 있다」는 표식을 단다」 하나만 빨개진다.**
확인했으면 **주석을 되돌리고** 다시 돌려 전부 초록인 것을 본다.

- [x] **6단계: 게이트**

```bash
P=$(lsof -ti:3000 | head -1); [ -n "$P" ] && kill $P
pnpm gate
```

예상: `EXIT=0` · 경고 31 이하.

- [x] **7단계: 커밋**

```bash
git add src/components/commons/DropdownMenu.tsx src/components/commons/DropdownMenu.test.tsx
git commit -m "feat: 단추에 붙는 더보기 메뉴 조각을 만든다(#1030)"
```

---

## 과제 2: `MyList` 를 갈아 끼운다

**파일:**
- 고침: `src/features/my-page/components/MyList.tsx` (import 21줄 · 사용 184~227줄)

**주고받는 것:**
- 쓰는 것: 과제 1 의 `DropdownMenu`·`DropdownMenuItem`
- 내놓는 것: 없음 (화면 하나를 바꿀 뿐)

- [x] **1단계: ⋮ 단추에 ref 와 낱말을 단다**

`MyList.tsx` 위쪽 `useState` 들 옆에 ref 를 더한다(63줄 언저리).

```tsx
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const moreButtonRef = useRef<HTMLButtonElement>(null)
```

`useRef` 를 import 에 더한다(`react` 에서 이미 `useState` 를 가져오고 있다).

- [x] **2단계: import 를 바꾼다**

```tsx
// 지운다
import { BottomSheet, BottomSheetItem } from '@/components/commons/BottomSheet'
// 더한다
import { DropdownMenu, DropdownMenuItem } from '@/components/commons/DropdownMenu'
```

- [x] **3단계: 175~228줄의 묶음을 갈아 끼운다**

`{!isMd ? ( … ) : null}` 안을 통째로 아래로 바꾼다.

```tsx
                {!isMd ? (
                  <div className="relative flex w-full items-start justify-between gap-2">
                    <h3 className="line-clamp-2 w-full text-sm font-normal">{title}</h3>
                    <IconButton
                      ref={moreButtonRef}
                      size="sm"
                      onClick={handleMoreToggle}
                      aria-label="상품 옵션 메뉴 열기"
                      aria-haspopup="menu"
                      aria-expanded={isMoreMenuOpen}
                    >
                      <EllipsisVertical size={16} className="text-gray-500" />
                    </IconButton>
                    {/* 단추에 붙는 드롭다운으로 연다(#1030).
                        모바일 웹은 앱이 아니라 데스크탑 웹의 반응형이라, 「이 항목에 대한
                        할 일」은 아래에서 올라오는 시트가 아니라 드롭다운이 맞다. */}
                    <DropdownMenu
                      isOpen={isMoreMenuOpen}
                      onClose={() => setIsMoreMenuOpen(false)}
                      triggerRef={moreButtonRef}
                      label={`${title} 상품 메뉴`}
                    >
                      {/* 판매내역 — 거래 상태 변경 */}
                      {isSalesTab && !isCompleted && currentTradeStatus !== 'SELLING' ? (
                        <DropdownMenuItem onClick={handleChangeTradeStatus('SELLING')}>
                          <span>판매중으로 바꾸기</span>
                        </DropdownMenuItem>
                      ) : null}
                      {isSalesTab && !isCompleted && currentTradeStatus !== 'RESERVED' ? (
                        <DropdownMenuItem onClick={handleChangeTradeStatus('RESERVED')}>
                          <span>예약중으로 바꾸기</span>
                        </DropdownMenuItem>
                      ) : null}
                      {isSalesTab && !isCompleted ? (
                        <DropdownMenuItem onClick={handleChangeTradeStatus('COMPLETED')}>
                          <span>판매완료로 바꾸기</span>
                        </DropdownMenuItem>
                      ) : null}

                      {/* 구매내역 — 구매완료 */}
                      {isPurchasesTab && !isCompleted ? (
                        <DropdownMenuItem onClick={handleChangeTradeStatus('COMPLETED')}>
                          <span>구매완료로 바꾸기</span>
                        </DropdownMenuItem>
                      ) : null}

                      {/* 수정 */}
                      {isMyProductTab && !isCompleted ? (
                        <DropdownMenuItem onClick={handleProductUpdate}>
                          <span>수정하기</span>
                        </DropdownMenuItem>
                      ) : null}

                      {/* 삭제 */}
                      <DropdownMenuItem tone="danger" onClick={handleDeleteClick}>
                        <span>삭제</span>
                      </DropdownMenuItem>
                    </DropdownMenu>
                  </div>
                ) : null}
```

⚠️ **항목 조건과 처리 함수는 하나도 안 바꾼다.** `handleChangeTradeStatus`·`handleProductUpdate`·`handleDeleteClick` 이 저마다 하는 `preventDefault`/`stopPropagation` 은 `<Link>` 안이라는 사실이 안 바뀌므로 그대로 필요하다.

- [x] **4단계: `IconButton` 이 ref 를 받는지 확인한다**

```bash
grep -n "forwardRef\|ref" src/components/commons/button/IconButton.tsx | head
```

- **받으면** 그대로 둔다.
- **안 받으면** `IconButton` 을 감싼 `<span ref={moreButtonRef} className="inline-flex">` 로 바꾸고, `triggerRef` 에 그 span 을 넘긴다. (React 19 는 함수 컴포넌트도 `ref` 를 props 로 받을 수 있으므로, 대개 `ref` 를 props 에 더하는 것으로 끝난다.)

- [x] **5단계: 타입체크와 시험**

```bash
npx tsc --noEmit
npx vitest run
```

예상: 타입 오류 0 · 시험 전부 통과(이 시점에는 `BottomSheet.test.tsx` 도 아직 돈다).

- [x] **6단계: ⭐ 진짜 크롬으로 셋을 잰다 — jsdom 이 못 잡는 것들**

dev 서버를 띄우고, **저장소 뿌리**에 잴 파일을 만든다.

```bash
nohup pnpm dev > /tmp/dev.log 2>&1 &
```

`/Users/osejin/Desktop/cuddle-market/.tmp-menu.mjs`:

```js
import { chromium } from 'playwright'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

// ⚠️ 로그인이 필요하다. 테스트 계정 devel.jjub+web798@gmail.com 으로 먼저 들어간 뒤
//    /mypage?panel=tab-sales 로 간다. 사람이 손으로 로그인한 브라우저를 쓰려면
//    launchPersistentContext 를 쓴다.
await page.goto('http://localhost:3000/mypage?panel=tab-sales', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

const 단추들 = page.getByRole('button', { name: '상품 옵션 메뉴 열기' })
const 개수 = await 단추들.count()
console.log(`⋮ 단추 ${개수}개`)
if (개수 < 2) console.log('⚠️ 상품이 2개 미만이다 — 잘림 검사가 무의미하다. 상품을 더 등록할 것')

// ① 마지막 카드의 메뉴가 안 잘리는가
await 단추들.last().click()
await page.waitForTimeout(300)
const 메뉴 = page.getByRole('menu')
const box = await 메뉴.boundingBox()
const vh = page.viewportSize().height
console.log(`① 메뉴 상자  top=${Math.round(box.y)} bottom=${Math.round(box.y + box.height)} / 화면높이 ${vh}`)
console.log(`   화면 안에 다 들어왔나: ${box.y >= 0 && box.y + box.height <= vh ? '예' : '아니오 ← 잘린다'}`)
console.log(`   보이나: ${await 메뉴.isVisible()}`)

// ② ESC 를 누르면 메뉴만 닫히고 패널은 남는가
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
const 메뉴닫힘 = (await page.getByRole('menu').count()) === 0
const 패널남음 = page.url().includes('panel=')
console.log(`② 메뉴 닫힘=${메뉴닫힘} · 패널 남음=${패널남음}  ${메뉴닫힘 && 패널남음 ? '✅' : '❌'}`)

// ③ 마우스를 올린 채 열었다 떼면 메뉴가 튀는가 (transform 기준점 함정)
const 카드 = page.locator('li').filter({ has: 단추들.last() }).last()
await 카드.hover()
await page.waitForTimeout(600)   // hover transition(500ms) 이 끝나기를 기다린다
await 단추들.last().click()
await page.waitForTimeout(300)
const 올린채 = await page.getByRole('menu').boundingBox()
await page.mouse.move(0, 0)
await page.waitForTimeout(700)
const 뗀뒤 = await page.getByRole('menu').boundingBox()
const 튐 = Math.abs(올린채.y - 뗀뒤.y) + Math.abs(올린채.x - 뗀뒤.x)
console.log(`③ 마우스 뗀 뒤 움직인 거리 ${Math.round(튐)}px  ${튐 < 2 ? '✅ 안 튄다' : '❌ 튄다'}`)

await page.screenshot({ path: '/tmp/menu-390.png' })
await browser.close()
```

```bash
node /Users/osejin/Desktop/cuddle-market/.tmp-menu.mjs
```

**셋 다 ✅ 여야 한다.** 하나라도 ❌ 면 고치고 다시 잰다.

⚠️ **①은 상품이 2개 이상일 때만 뜻이 있다.** 1개 이하면 `MyPagePanel.tsx:204` 가 `overflow-visible` 이라 자름이 애초에 없다.

- [x] **7단계: ⭐ 마커 검증 — ②가 표식 때문인지 증명한다**

`DropdownMenu.tsx` 에서 표식 한 줄만 잠깐 지우고 ②만 다시 잰다.

```tsx
// {...{ [OVERLAY_ABOVE_ATTR]: '' }}      ← 이 줄만 주석 처리
```

예상: **`패널 남음=false`** 가 되어야 한다 — ESC 한 번에 패널까지 닫히는 것을 눈으로 본다.
확인했으면 **되돌리고** 다시 재서 ✅ 로 돌아오는 것을 본다.

「고쳤다」가 아니라 **「이것 때문이다」**를 증명하는 단계다.

- [x] **8단계: 잰 파일을 지우고 게이트**

```bash
rm -f /Users/osejin/Desktop/cuddle-market/.tmp-menu.mjs
P=$(lsof -ti:3000 | head -1); [ -n "$P" ] && kill $P
pnpm gate
nohup pnpm dev > /tmp/dev.log 2>&1 &
```

- [x] **9단계: 커밋**

```bash
git add src/features/my-page/components/MyList.tsx
git commit -m "refactor: 마이페이지 더보기 메뉴를 시트에서 드롭다운으로 바꾼다(#1030)"
```

---

## 과제 3: 쓰임이 없어진 시트를 걷는다

**파일:**
- 지움: `src/components/commons/BottomSheet.tsx`
- 지움: `src/components/commons/BottomSheet.test.tsx`
- 고침: `src/app/globals.css` (110~132줄)

**주고받는 것:**
- 쓰는 것: 과제 2 가 끝나 `BottomSheet` 를 쓰는 곳이 0 이 된 상태
- 내놓는 것: 없음

- [x] **1단계: 정말 아무도 안 쓰는지 확인한다**

```bash
grep -rn "BottomSheet" src --include='*.ts' --include='*.tsx'
grep -rn "bottom-sheet__panel\|bottom-sheet-rise" src
```

예상: `BottomSheet.tsx`·`BottomSheet.test.tsx`·`globals.css` **자기들끼리만** 나온다. `MyList` 가 나오면 과제 2 가 덜 끝난 것이다.

⚠️ 앱의 `mobile/components/ui/bottom-sheet.tsx` 는 **다른 파일**이고 앱 5곳이 쓴다. `src/` 만 본다.

- [x] **2단계: `globals.css` 에서 시트 애니메이션을 지운다**

`src/app/globals.css` 의 110~132줄 언저리, `@keyframes bottom-sheet-rise` · `.bottom-sheet__panel` · 그 `prefers-reduced-motion` 블록을 지운다. 먼저 눈으로 범위를 본다.

```bash
sed -n 105,135p src/app/globals.css
```

- [x] **3단계: 파일 둘을 지운다**

```bash
git rm src/components/commons/BottomSheet.tsx src/components/commons/BottomSheet.test.tsx
```

- [x] **4단계: 게이트 셋 다**

```bash
P=$(lsof -ti:3000 | head -1); [ -n "$P" ] && kill $P
pnpm gate:all
```

예상: `EXIT=0`.
- 웹 시험이 **`BottomSheet.test.tsx` 의 18개만큼 줄고 `DropdownMenu.test.tsx` 의 9개만큼 는다.**
- ⚠️ **앱 시험 수는 그대로여야 한다.** 줄었으면 앱 파일을 잘못 건드린 것이다.

- [x] **5단계: 커밋**

```bash
git add -A src/app/globals.css
git commit -m "refactor: 쓰임이 없어진 하단 시트 조각을 걷는다(#1030)"
```

- [x] **6단계: 푸시하고 PR**

```bash
git push -u origin refactor/1030--menu-dropdown
```

PR 본문은 `.github/PULL_REQUEST_TEMPLATE.md` 를 열어 그대로 따른다. 관련 이슈는 **목록 항목**으로 적는다.

```
## 📎 관련 이슈

- Close #1030
```

리뷰어 참고 사항에 **6단계에서 잰 크롬 실측값 셋**과 **마커 검증 결과**를 그대로 붙인다.

---

## 다 끝난 뒤의 모습

```
웹의 더보기 메뉴 셋이 전부 드롭다운
  채팅방 ⋮        ChatRoomInfo    (그대로)
  남의 프로필 ⋮    ProfileData     (그대로)
  마이페이지 ⋮     MyList          ← 이번에 바뀐 것

지워진 것   BottomSheet.tsx 145줄 · 짝 시험 274줄 · globals.css 23줄
새로 생긴 것 DropdownMenu.tsx · 짝 시험 9개
지도의 시트  그대로 (다른 물건이다)
```

**다음 단계(별도 이슈):** `ChatRoomInfo`·`ProfileData` 도 `DropdownMenu` 로 옮긴다. 특히 `ChatRoomInfo` 는 낱말이 하나도 없고(`role="menu"`·`aria-haspopup`·`aria-expanded` 전무) 자르는 조상 두 겹(`ChattingPage.tsx:304,319`) 안에 있어 같은 잘림 위험이 잠재해 있다.
