import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dailypriority.com'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/signin', '/signup', '/reset-password', '/verify-email', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
