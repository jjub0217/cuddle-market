import { useRef, type RefObject } from 'react'
import type { UseFormRegister } from 'react-hook-form'
import Button from '@/components/commons/button/Button'
import { cn } from '@/lib/utils/cn'

interface CommentFormValues {
  content: string
}

type CommentFormVariant = 'default' | 'compact'

interface CommentFormProps {
  id: string
  placeholder: string
  legendText: string
  register?: UseFormRegister<CommentFormValues>
  value?: string
  onChangeValue?: (value: string) => void
  onSubmit: () => void
  onCancel?: () => void
  textareaRef?: RefObject<HTMLTextAreaElement | null>
  variant?: CommentFormVariant
}

const MAX_ROWS = 4
const LINE_HEIGHT = 20
const DEFAULT_PADDING_Y = 16
const COMPACT_PADDING_Y = 4
const DEFAULT_BASE = LINE_HEIGHT + DEFAULT_PADDING_Y // 36px
const DEFAULT_MAX = LINE_HEIGHT * MAX_ROWS + DEFAULT_PADDING_Y // 96px
const COMPACT_BASE = LINE_HEIGHT + COMPACT_PADDING_Y // 24px
const COMPACT_MAX = LINE_HEIGHT * MAX_ROWS + COMPACT_PADDING_Y // 84px

export function CommentForm({
  id,
  placeholder,
  legendText,
  register,
  value,
  onChangeValue,
  onSubmit,
  onCancel,
  textareaRef: externalRef,
  variant = 'default',
}: CommentFormProps) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null)
  const registerProps = register ? register('content') : null
  const { ref, onChange, ...rest } = registerProps ?? { ref: undefined, onChange: undefined }

  const isCompact = variant === 'compact'
  const baseHeight = isCompact ? COMPACT_BASE : DEFAULT_BASE
  const maxHeight = isCompact ? COMPACT_MAX : DEFAULT_MAX

  const setRefs = (el: HTMLTextAreaElement | null) => {
    if (ref) ref(el)
    internalRef.current = el
    if (externalRef) externalRef.current = el
  }

  const handleAutoResize = () => {
    const textarea = internalRef.current
    if (!textarea) return
    textarea.style.height = `${baseHeight}px`
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${newHeight}px`
  }

  if (isCompact) {
    // 답글용 컴팩트 단일 행 디자인 (오늘의집 패턴)
    return (
      <form className="border-outline-variant/40 flex items-end gap-2 rounded-lg border bg-white px-3 py-2" onSubmit={onSubmit}>
        <fieldset className="flex flex-1 items-center gap-2">
          <legend className="sr-only">{legendText}</legend>
          <textarea
            id={id}
            placeholder={placeholder}
            className="scrollbar-hide flex-1 resize-none bg-transparent text-sm leading-6 placeholder:text-gray-400 focus:outline-none"
            style={{ height: `${baseHeight}px`, maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
            ref={setRefs}
            value={onChangeValue ? value : undefined}
            onChange={(e) => {
              if (onChange) onChange(e)
              if (onChangeValue) onChangeValue(e.target.value)
              handleAutoResize()
            }}
            {...rest}
          />
          <button type="submit" className="text-primary-container shrink-0 cursor-pointer text-sm font-bold">
            등록
          </button>
        </fieldset>
      </form>
    )
  }

  // 기본 (댓글 입력) — 기존 디자인 유지
  return (
    <form className="md:bg-primary-50 bg-transparent p-0 md:rounded-lg md:pt-5 md:pr-6 md:pb-4 md:pl-4" onSubmit={onSubmit}>
      <fieldset className="flex items-end gap-3.5 md:block">
        <legend className="sr-only">{legendText}</legend>
        <textarea
          id={id}
          placeholder={placeholder}
          className={cn(
            'scrollbar-hide w-full flex-1 resize-none rounded-lg bg-[#f0f4ff] px-3 py-2 leading-tight focus:outline-none',
            'md:bg-primary-50 md:h-auto md:rounded-none md:px-0 md:py-0 md:leading-normal'
          )}
          style={{ height: `${baseHeight}px`, maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
          ref={setRefs}
          value={onChangeValue ? value : undefined}
          onChange={(e) => {
            if (onChange) onChange(e)
            if (onChangeValue) onChangeValue(e.target.value)
            handleAutoResize()
          }}
          {...rest}
        />
        <div className="flex items-center justify-end gap-3.5">
          {onCancel ? (
            <Button size="md" className="cursor-pointer rounded-full bg-gray-100 text-sm shadow" type="button" onClick={onCancel}>
              취소
            </Button>
          ) : null}
          <Button size="md" className="cursor-pointer rounded-full bg-white text-sm shadow" type="submit">
            등록
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
