const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export async function fetchInitialProducts() {
  const res = await fetch(`${API_BASE_URL}/products/search?page=0&size=20`, {
    next: { revalidate: 60 },
  })

  if (!res.ok) return null

  const json = await res.json()
  return {
    data: json,
    total: json.data.totalElements,
  }
}
