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
    // ⚠️ 글칸에 초점이 가면 글칸이 아니라 **바깥 상자(form)**가 초점 테두리를 그린다(#1130).
    //    글칸에도 그리면 상자 안에 테두리가 하나 더 생긴다 — 그래서 글칸은 `focus-ring-custom`.
    //    전역 규칙에서 빠지면 브라우저 기본 파란 윤곽선이 되살아나서 `outline-none` 도 같이 준다.
    //    `has-[textarea:focus]` 라서 「등록」 단추에 Tab 으로 갔을 때는 단추만 테두리를 보인다.
    return (
      <form className="border-outline-variant/40 has-[textarea:focus]:border-primary-500 flex items-end gap-2 rounded-lg border bg-white px-3 py-2 has-[textarea:focus]:border-[1.2px]" onSubmit={onSubmit}>
        <fieldset className="flex flex-1 items-center gap-2">
          <legend className="sr-only">{legendText}</legend>
          <textarea
            id={id}
            placeholder={placeholder}
            className="focus-ring-custom scrollbar-hide flex-1 outline-none resize-none bg-transparent text-sm leading-6 placeholder:text-gray-400"
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

  // 기본 (댓글 입력) — 모바일은 가로 컴팩트 카드, 데스크탑은 세로 카드. 색상은 디자인 시스템 토큰 통일
  // ⚠️ 초점 테두리는 위 답글 칸과 같은 방식으로 **카드(form)**가 그린다(#1130). 글칸과 카드의 바탕색이
  //    같아서 글칸에 그리면 카드 안에 네모가 떠 보인다. 평소 `border-transparent` 는 초점 때
  //    테두리가 생기며 카드가 커지지 않게 자리를 잡아 두는 것이다.
  return (
    <form className="bg-primary-50 has-[textarea:focus]:border-primary-500 rounded-lg border border-transparent px-3 py-2 has-[textarea:focus]:border-[1.2px] md:pt-5 md:pr-6 md:pb-4 md:pl-4" onSubmit={onSubmit}>
      <fieldset className="flex items-end gap-3.5 md:block">
        <legend className="sr-only">{legendText}</legend>
        <textarea
          id={id}
          placeholder={placeholder}
          className={cn(
            'focus-ring-custom scrollbar-hide bg-primary-50 outline-none w-full flex-1 resize-none leading-tight',
            'md:h-auto md:leading-normal'
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
