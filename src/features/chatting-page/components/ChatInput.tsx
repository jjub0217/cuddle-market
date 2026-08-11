'use client'

import { useLayoutEffect, useRef } from 'react'

/**
 * 칸이 늘어날 수 있는 최대 높이(px). **여섯 줄**이고, 여기를 넘으면 칸 안에서 스크롤한다.
 *
 * 왜 136인가 — `scrollHeight` 는 **위아래 여백을 포함해서** 잰다.
 *
 * ```
 *   글 여섯 줄   20px × 6 = 120   (text-sm 은 14px/20px)
 *   위아래 여백  8px × 2  =  16   (py-2 — 한 줄일 때 높이를 단추와 같은 36px 로 맞추는 값)
 *                          ─────
 *                            136
 * ```
 *
 * ⚠️ 예전에는 120이었다. 그때는 여백이 없어 120 = 여섯 줄이 맞았지만, 세로 정렬을 맞추려고
 *    여백을 준 뒤로는 120이 **다섯 줄(104px)＋여백** 밖에 안 된다(#890). 지키려던 것은
 *    「120이라는 숫자」가 아니라 「여섯 줄까지 보인다」였으므로 줄 수 쪽을 남긴다.
 *
 * ⚠️ 앱도 여섯 줄이지만 상수는 120이다(`mobile/components/chat/chat-input.tsx` 의
 *    `maxHeight: 120`). 앱은 여백이 10px×2 = 20px 이고 글자 한 줄이 더 낮아서 그렇다.
 *    **두 숫자를 억지로 맞추면 오히려 줄 수가 어긋난다** — 맞출 것은 줄 수다.
 */
const MAX_HEIGHT = 136

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export default function ChatInput({ value, onChange, onSubmit }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 글이 길어지면 칸을 키운다.
  //
  // ⚠️ 예전에는 `rows={1}` 에 고정돼 있어, 여러 줄을 쓰면 **지금 쓰는 줄만 보이고 앞서 쓴
  //    줄은 위로 밀려 안 보였다.** 보내기 전에 전체를 다시 읽을 수가 없었다(#880).
  //
  // ⚠️ **먼저 'auto' 로 풀고 나서 재야 한다.** 안 풀면 scrollHeight 가 지금 높이에 갇혀
  //    글을 지워도 안 줄어든다.
  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (value.length === 0) return
    // IME 조합 중일 때는 무시 (한글 입력 시 중복 전송 방지)
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      value={value}
      placeholder="메시지를 입력하세요"
      // 최대 높이는 Tailwind 값이 아니라 위 상수로 준다 — 재는 쪽과 막는 쪽을 한 곳에서 본다.
      style={{ maxHeight: MAX_HEIGHT }}
      // py-2 는 **세로 정렬을 맞추는 값이다.** 묶음이 items-end 라서(여러 줄일 때 단추가
      // 아래에 붙게 하려고) 여백이 없으면 20px 짜리 글자칸이 36px 짜리 단추 바닥에 붙어
      // 글자만 8px 아래로 내려앉는다(#890). 20 + 8×2 = 36 — 한 줄일 때 단추와 키가 같아진다.
      className="w-full resize-none overflow-y-auto bg-transparent py-2 text-sm placeholder:text-gray-400 focus:outline-none"
    />
  )
}
