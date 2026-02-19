const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export interface ProductSitemapEntry {
  id: number
  title: string
  createdAt: string
}

export interface CommunitySitemapEntry {
  id: number
  title: string
  createdAt: string
  updatedAt: string
}

export async function fetchProductSitemapEntries(): Promise<ProductSitemapEntry[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/search?page=0&size=1000`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data.content ?? []
  } catch {
    return []
  }
}

export async function fetchCommunitySitemapEntries(
  boardType: string,
): Promise<CommunitySitemapEntry[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/community/posts?boardType=${boardType}&page=0&size=1000`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data.content ?? []
  } catch {
    return []
  }
}
