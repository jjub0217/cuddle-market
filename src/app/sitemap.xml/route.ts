import { toUrlName } from '@/lib/utils/toUrlName'
import { fetchProductSitemapEntries, fetchCommunitySitemapEntries } from '@/lib/api/server/sitemap'

export const revalidate = 3600

const SITE_URL = 'https://cuddle-market.vercel.app'

function sitemapUrl(url: string): string {
  return encodeURI(url)
    .replace(/&/g, '&amp;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const [products, questionPosts, infoPosts] = await Promise.all([
    fetchProductSitemapEntries(),
    fetchCommunitySitemapEntries('QUESTION'),
    fetchCommunitySitemapEntries('INFO'),
  ])

  const urls: string[] = []

  // Static pages
  urls.push(`
  <url>
    <loc>${SITE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`)

  urls.push(`
  <url>
    <loc>${SITE_URL}/community</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`)

  // Product pages
  for (const product of products) {
    urls.push(`
  <url>
    <loc>${sitemapUrl(`${SITE_URL}/products/${product.id}/${toUrlName(product.title)}`)}</loc>
    <lastmod>${product.createdAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`)
  }

  // Community pages
  for (const post of [...questionPosts, ...infoPosts]) {
    urls.push(`
  <url>
    <loc>${sitemapUrl(`${SITE_URL}/community/${post.id}/${toUrlName(post.title)}`)}</loc>
    <lastmod>${post.updatedAt || post.createdAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
