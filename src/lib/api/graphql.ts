import { useUserStore } from '@/store/userStore'

export async function fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = useUserStore.getState().accessToken
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}
