'use client'

import { useLayoutEffect, useRef } from 'react'

/**
 * 칸이 늘어날 수 있는 최대 높이(px). 여섯 줄쯤이고, **앱과 같은 값이다**
 * (`mobile/components/chat/chat-input.tsx` 의 `maxHeight: 120`).
 * 여기를 넘으면 칸 안에서 스크롤한다.
 */
const MAX_HEIGHT = 120

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
      // 최대 높이는 Tailwind 값이 아니라 위 상수로 준다 — 앱과 같은 값을 한 곳에서 본다.
      style={{ maxHeight: MAX_HEIGHT }}
      className="w-full resize-none overflow-y-auto bg-transparent text-sm placeholder:text-gray-400 focus:outline-none"
    />
  )
}
