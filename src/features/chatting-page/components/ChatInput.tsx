interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export default function ChatInput({ value, onChange, onSubmit }: ChatInputProps) {
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
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      value={value}
      placeholder="채팅을 입력하세요."
      className="h-fit w-full resize-none rounded bg-[#E5E7EB]/50 p-2.5 focus:outline-none"
    />
  )
}
