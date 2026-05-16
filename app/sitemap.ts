import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/posts' // or wherever your post loader lives

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts()
  
  const staticPages = [
    {
      url: 'https://keelbase.io',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: 'https://keelbase.io/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]
  
  const postPages = posts.map((post) => ({
    url: `https://keelbase.io/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))
  
  return [...staticPages, ...postPages]
}