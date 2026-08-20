import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://janashabdam.in'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    { url: siteUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/campaign/esa-draft-notification`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/data`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${siteUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/faq`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/privacy`, lastModified, changeFrequency: 'monthly', priority: 0.5 },
  ]
}
