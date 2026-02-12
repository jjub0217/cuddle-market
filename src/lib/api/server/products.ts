import type { ProductDetailItem } from '@/types/product'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function fetchInitialProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/products/search?page=0&size=20`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) return null

    const json = await res.json()
    return {
      data: json,
      total: json.data.totalElements,
    }
  } catch {
    return null
  }
}

export async function fetchProductDetail(id: string): Promise<ProductDetailItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      next: { revalidate: 60 },
    })

    if (!res.ok) return null

    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}
