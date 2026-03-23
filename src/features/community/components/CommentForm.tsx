import { useCallback, useRef, type RefObject } from 'react'
import type { UseFormRegister } from 'react-hook-form'
import Button from '@/components/commons/button/Button'

interface CommentFormValues {
  content: string
}

interface CommentFormPropsBase {
  id: string
  placeholder: string
  legendText: string
  onSubmit: () => void
  onCancel?: () => void
  textareaRef?: RefObject<HTMLTextAreaElement | null>
}

interface RegisterProps extends CommentFormPropsBase {
  register: UseFormRegister<CommentFormValues>
  value?: never
  onChange?: never
}

interface ControlledProps extends CommentFormPropsBase {
  register?: never
  value: string
  onChange: (value: string) => void
}

type CommentFormProps = RegisterProps | ControlledProps

const MAX_ROWS = 4
const LINE_HEIGHT = 20
const PADDING_Y = 16
const BASE_HEIGHT = LINE_HEIGHT + PADDING_Y
const MAX_HEIGHT = LINE_HEIGHT * MAX_ROWS + PADDING_Y

export function CommentForm({ id, placeholder, legendText, onSubmit, onCancel, textareaRef: externalRef, ...props }: CommentFormProps) {
  const internalRef = useRef<HTMLTextAreaElement | null>(null)
  const textareaRef = externalRef || internalRef

  const isControlled = 'value' in props && props.value !== undefined
  const registerResult = !isControlled && props.register ? props.register('content') : null

  const handleAutoResize = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = `${BASE_HEIGHT}px`
    const newHeight = Math.min(textarea.scrollHeight, MAX_HEIGHT)
    textarea.style.height = `${newHeight}px`
  }, [textareaRef])

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
            if (registerResult) registerResult.ref(e)
            textareaRef.current = e
          }}
          value={isControlled ? props.value : undefined}
          onChange={(e) => {
            if (isControlled) {
              props.onChange(e.target.value)
            } else if (registerResult) {
              registerResult.onChange(e)
            }
            handleAutoResize()
          }}
          {...(registerResult ? { name: registerResult.name, onBlur: registerResult.onBlur } : {})}
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
