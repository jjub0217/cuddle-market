import { type FieldErrors, type UseFormClearErrors, type UseFormSetValue, type UseFormSetError, type FieldValues, type Path } from 'react-hook-form'
import DropzoneArea from './components/DropzoneArea'
import FormSectionHeader from '../FormSectionHeader'
import { cn } from '@/lib/utils/cn'

interface ImageUploadFieldProps<T extends FieldValues> {
  setValue: UseFormSetValue<T>
  errors: FieldErrors<T>
  setError: UseFormSetError<T>
  clearErrors: UseFormClearErrors<T>
  mainImageField: Path<T>
  subImagesField?: Path<T>
  initialImages?: string[]
  maxFiles?: number
  heading?: string
  description?: string
  showSection?: boolean
  headingClassName?: string
  className?: string
}

export default function ImageUploadField<T extends FieldValues>({
  setValue,
  errors,
  setError,
  clearErrors,
  mainImageField,
  subImagesField,
  initialImages,
  maxFiles,
  heading = '상품 이미지 (선택항목)',
  description,
  showSection = true,
  headingClassName,
  className,
}: ImageUploadFieldProps<T>) {
  const errorMessage = errors[mainImageField]?.message as string | undefined

  const content = (
    <div className={cn('flex flex-col gap-5', className)}>
      <FormSectionHeader heading={heading} description={description} headingClassName={headingClassName} />
      <DropzoneArea
        initialImages={initialImages}
        setValue={setValue}
        setError={setError}
        clearErrors={clearErrors}
        mainImageField={mainImageField}
        subImagesField={subImagesField}
        maxFiles={maxFiles}
      />
      {errorMessage && <p className="text-danger-500 text-sm font-semibold">{errorMessage}</p>}
    </div>
  )

  if (!showSection) {
    return content
  }

  return <section className="flex flex-col gap-6 rounded-xl border border-gray-100 bg-white px-6 py-5">{content}</section>
}
