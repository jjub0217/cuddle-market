import type { MetadataRoute } from 'next'
import { toUrlName } from '@/lib/utils/toUrlName'
import { fetchProductSitemapEntries, fetchCommunitySitemapEntries } from '@/lib/api/server/sitemap'

const SITE_URL = 'https://cuddle-market.vercel.app'

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
    fetchProductSitemapEntries(),
    fetchCommunitySitemapEntries('QUESTION'),
    fetchCommunitySitemapEntries('INFO'),
  ])

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.id}/${toUrlName(product.title)}`,
    lastModified: product.createdAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const communityPages: MetadataRoute.Sitemap = [...questionPosts, ...infoPosts].map((post) => ({
    url: `${SITE_URL}/community/${post.id}/${toUrlName(post.title)}`,
    lastModified: post.updatedAt || post.createdAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticPages, ...productPages, ...communityPages]
}
