import type { CommunityDetailItem, CommunityItem, Comment } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface CommunityListData {
  page: number
  size: number
  total: number
  content: CommunityItem[]
  hasNext: boolean
  hasPrevious: boolean
  totalElements: number
  numberOfElements: number
}

export async function fetchInitialQuestionCommunity(
  page: number = 0,
  size: number = 10,
  searchType?: string | null,
  keyword?: string | null,
  sortBy?: string | null
): Promise<CommunityListData | null> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      boardType: 'QUESTION',
    })
    if (searchType) params.append('searchType', searchType)
    if (keyword) params.append('keyword', keyword)
    if (sortBy) params.append('sortBy', sortBy)

    const res = await fetch(`${API_BASE_URL}/community/posts?${params.toString()}`, {
      cache: 'no-store',
    })

    if (!res.ok) return null

    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

export async function fetchInitialInfoCommunity(
  page: number = 0,
  size: number = 10,
  searchType?: string | null,
  keyword?: string | null,
  sortBy?: string | null
): Promise<CommunityListData | null> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      boardType: 'INFO',
    })
    if (searchType) params.append('searchType', searchType)
    if (keyword) params.append('keyword', keyword)
    if (sortBy) params.append('sortBy', sortBy)

    const res = await fetch(`${API_BASE_URL}/community/posts?${params.toString()}`, {
      cache: 'no-store',
    })

    if (!res.ok) return null

    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

export async function fetchCommunityDetail(postId: string): Promise<CommunityDetailItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts/${postId}`, {
      cache: 'no-store',
    })

    if (!res.ok) return null

    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

export async function fetchCommunityComments(postId: string): Promise<{ comments: Comment[] } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts/${postId}/comments`, {
      cache: 'no-store',
    })

    if (!res.ok) return null

    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}
