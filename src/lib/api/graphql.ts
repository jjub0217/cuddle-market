import axios from 'axios'
import { useUserStore } from '@/store/userStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'

let tokenRefreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!tokenRefreshPromise) {
    tokenRefreshPromise = (async () => {
      try {
        const refreshToken = useUserStore.getState().refreshToken
        if (!refreshToken) throw new Error('No refresh token')

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
        const newAccessToken = response.data?.data?.accessToken ?? null
        useUserStore.getState().setAccessToken(newAccessToken)
        return newAccessToken
      } catch {
        useUserStore.getState().clearAll()
        if (typeof window !== 'undefined') window.location.href = '/auth/login'
        return null
      }
    })().finally(() => {
      tokenRefreshPromise = null
    })
  }
  return tokenRefreshPromise
}

function isUnauthorizedError(json: { errors?: { message: string }[] }): boolean {
  return json.errors?.some((e) => e.message.includes('401')) ?? false
}

async function executeGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = useUserStore.getState().accessToken
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`)
  return await res.json()
}

export async function fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const json = await executeGraphQL<{ data: T; errors?: { message: string }[] }>(query, variables)

  if (isUnauthorizedError(json)) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      const retryJson = await executeGraphQL<{ data: T; errors?: { message: string }[] }>(query, variables)
      if (retryJson.errors) throw new Error(retryJson.errors[0].message)
      return retryJson.data
    }
  }

  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}
