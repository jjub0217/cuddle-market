import { useState } from 'react'
import { uploadImage } from '@/lib/api/products'

interface UseMdImageUploadOptions {
  maxSize?: number
  onError?: (message: string) => void
}

export function useMdImageUpload({ maxSize = 5 * 1024 * 1024, onError }: UseMdImageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false)

  const upload = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) {
      onError?.('이미지 파일만 업로드할 수 있습니다.')
      return null
    }

    if (file.size > maxSize) {
      onError?.(`파일 크기는 ${Math.floor(maxSize / 1024 / 1024)}MB를 초과할 수 없습니다.`)
      return null
    }

    setIsUploading(true)
    try {
      const result = await uploadImage([file])
      return result.mainImageUrl
    } catch {
      onError?.('이미지 업로드에 실패했습니다.')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  return { upload, isUploading }
}
