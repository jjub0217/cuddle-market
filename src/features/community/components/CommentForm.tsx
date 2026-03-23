import { useCallback, useRef, type RefObject } from 'react'
import type { UseFormRegister } from 'react-hook-form'
import Button from '@/components/commons/button/Button'

interface CommentFormValues {
  content: string
}

interface CommentFormProps {
  id: string
  placeholder: string
  legendText: string
  register: UseFormRegister<CommentFormValues>
  onSubmit: () => void
  onCancel?: () => void
  textareaRef?: RefObject<HTMLTextAreaElement | null>
}

const MAX_ROWS = 4
const LINE_HEIGHT = 20 // leading-tight (1.25) * 16px
const PADDING_Y = 16 // py-2 = 8px * 2
const BASE_HEIGHT = LINE_HEIGHT + PADDING_Y // 1행 높이 (36px)
const MAX_HEIGHT = LINE_HEIGHT * MAX_ROWS + PADDING_Y // 5행 높이 (116px)

export function CommentForm({ id, placeholder, legendText, register, onSubmit, onCancel, textareaRef: externalRef }: CommentFormProps) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null)
  const textareaRef = externalRef || internalRef
  const { ref, onChange, ...rest } = register('content')

  const handleAutoResize = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = `${BASE_HEIGHT}px`
    const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT)
    textarea.style.height = `${newHeight}px`
  }, [])

  return (
    <form className="bg-transparent p-0 md:bg-primary-50 md:rounded-lg md:pt-5 md:pr-6 md:pb-4 md:pl-4" onSubmit={onSubmit}>
      <fieldset className="flex items-end gap-3.5 md:block">
        <legend className="sr-only">{legendText}</legend>
        <textarea
          id={id}
          placeholder={placeholder}
          className="flex-1 rounded-lg bg-[#f0f4ff] px-3 py-2 leading-tight scrollbar-hide md:h-auto md:leading-normal md:bg-primary-50 md:rounded-none md:px-0 md:py-0 w-full resize-none focus:outline-none"
          style={{ height: `${BASE_HEIGHT}px`, maxHeight: `${MAX_HEIGHT}px`, overflowY: 'auto' }}
          ref={(e) => {
            ref(e)
            textareaRef.current = e
          }}
          onChange={(e) => {
            onChange(e)
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
