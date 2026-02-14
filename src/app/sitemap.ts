import type { MetadataRoute } from 'next'

const SITE_URL = 'https://cuddle-market.vercel.app'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/community`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  const [products, questionPosts, infoPosts] = await Promise.all([
    fetchAllProducts(),
    fetchAllCommunityPosts('QUESTION'),
    fetchAllCommunityPosts('INFO'),
  ])

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.id}`,
    lastModified: product.createdAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const communityPages: MetadataRoute.Sitemap = [...questionPosts, ...infoPosts].map((post) => ({
    url: `${SITE_URL}/community/${post.id}`,
    lastModified: post.updatedAt || post.createdAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...communityPages]
}

async function fetchAllProducts(): Promise<{ id: number; createdAt: string }[]> {
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

async function fetchAllCommunityPosts(
  boardType: string
): Promise<{ id: number; createdAt: string; updatedAt: string }[]> {
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
