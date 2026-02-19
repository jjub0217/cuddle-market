import type { ProductDetailItem } from '@/types/product'
import type { ProductSearchParams } from '@/lib/queries/productQueryKeys'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function fetchProducts(params: ProductSearchParams, page: number = 0, size: number = 20) {
  try {
    const urlParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    })

    if (params.keyword) urlParams.append('keyword', params.keyword)
    if (params.petType) urlParams.append('petType', params.petType)
    if (params.petDetailType) urlParams.append('petDetailType', params.petDetailType)
    if (params.productType) urlParams.append('productType', params.productType)
    if (params.productStatuses) urlParams.append('productStatuses', params.productStatuses)
    if (params.minPrice) urlParams.append('minPrice', params.minPrice)
    if (params.maxPrice) urlParams.append('maxPrice', params.maxPrice)
    if (params.addressSido) urlParams.append('addressSido', params.addressSido)
    if (params.addressGugun) urlParams.append('addressGugun', params.addressGugun)
    if (params.categories) urlParams.append('categories', params.categories)
    if (params.sortBy) urlParams.append('sortBy', params.sortBy)
    if (params.sortOrder) urlParams.append('sortOrder', params.sortOrder)

    const res = await fetch(`${API_BASE_URL}/products/search?${urlParams.toString()}`, {
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

/** @deprecated Use fetchProducts instead */
export async function fetchInitialProducts() {
  return fetchProducts({})
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
