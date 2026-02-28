import type {
  EmailCheckResponse,
  ResettingPasswordRequestData,
  ResettingPasswordResponse,
} from '@/types'
import { api } from './api'
import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

export const sendValidCode = async (email: string): Promise<EmailCheckResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/password/reset/send`, { email })
  return response.data
}

export const checkValidCode = async (email: string, code: string): Promise<EmailCheckResponse> => {
  const response = await axios.post(`${API_BASE_URL}/auth/password/reset/verify`, { email, verificationCode: code })
  return response.data
}

export const reSettingPassword = async (requestData: ResettingPasswordRequestData) => {
  const response = await api.patch<ResettingPasswordResponse>(`/auth/password/reset`, requestData)
  return response.data
}
