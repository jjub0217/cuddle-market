import type { ImageUploadResponse } from '@/types'
import { api } from './api'

export const uploadImage = async (files: File[]): Promise<ImageUploadResponse['data']> => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  const response = await api.post<ImageUploadResponse>('/images', formData)
  return response.data.data
}
