import type { MetadataRoute } from 'next'

const SITE_URL = 'https://cuddle-market.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: [
        '/auth/',
        '/mypage',
        '/profile-update',
        '/product-post',
        '/community-post',
        '/*edit',
        '/chat',
        '/oauth-redirect',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
