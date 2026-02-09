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
}

export function CommentForm({ id, placeholder, legendText, register, onSubmit, onCancel }: CommentFormProps) {
  return (
    <form className="bg-primary-50 rounded-lg pt-5 pr-6 pb-4 pl-4" onSubmit={onSubmit}>
      <fieldset>
        <legend className="sr-only">{legendText}</legend>
        <textarea
          id={id}
          placeholder={placeholder}
          className="bg-primary-50 w-full resize-none focus:outline-none"
          {...register('content')}
        />
        <div className="flex items-center justify-end gap-3.5">
          <Button size="md" className="cursor-pointer rounded-full bg-gray-100 text-sm shadow" type="button" onClick={onCancel}>
            취소
          </Button>
          <Button size="md" className="cursor-pointer rounded-full bg-white text-sm shadow" type="submit">
            등록
          </Button>
        </div>
      </fieldset>
    </form>
  )
}
