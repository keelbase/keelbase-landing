// lib/notion.ts — Notion blog helpers

const NOTION_API_KEY          = process.env.NOTION_API_KEY!
const NOTION_BLOG_DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID!

const headers = {
  'Authorization': `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
}

export type Post = {
  id:      string
  slug:    string
  title:   string
  excerpt: string
  author:  string
  date:    string
  cover:   string | null
}

export type NotionBlock = {
  id:   string
  type: string
  [key: string]: unknown
}

type RichText = { plain_text: string; annotations?: { bold?: boolean; italic?: boolean; code?: boolean }; href?: string | null }

type NotionPage = {
  id: string
  cover: { type: string; external?: { url: string }; file?: { url: string } } | null
  properties: {
    Title:     { title: RichText[] }
    Slug:      { rich_text: RichText[] }
    Excerpt:   { rich_text: RichText[] }
    Author:    { rich_text: RichText[] }
    Date:      { date: { start: string } | null }
    Published: { checkbox: boolean }
    Cover:     { rich_text: RichText[] }
  }
}

function extractPost(page: NotionPage): Post {
  const p = page.properties
  return {
    id:      page.id,
    slug:    p.Slug?.rich_text?.[0]?.plain_text    ?? '',
    title:   p.Title?.title?.[0]?.plain_text       ?? 'Untitled',
    excerpt: p.Excerpt?.rich_text?.[0]?.plain_text ?? '',
    author:  p.Author?.rich_text?.[0]?.plain_text  ?? 'Keelbase',
    date:    p.Date?.date?.start                   ?? '',
    cover:   p.Cover?.rich_text?.[0]?.plain_text ?? page.cover?.external?.url ?? page.cover?.file?.url ?? null,
  }
}

export async function getPosts(): Promise<Post[]> {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_BLOG_DATABASE_ID}/query`, {
      method: 'POST', headers,
      body: JSON.stringify({
        filter: { property: 'Published', checkbox: { equals: true } },
        sorts:  [{ property: 'Date', direction: 'descending' }],
      }),
      next: { revalidate: 60 },
    })
    if (!res.ok) { console.error('[Notion] getPosts:', await res.text()); return [] }
    const data = await res.json()
    return data.results.map((page: NotionPage) => extractPost(page))
  } catch (e) { console.error('[Notion] getPosts error:', e); return [] }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_BLOG_DATABASE_ID}/query`, {
      method: 'POST', headers,
      body: JSON.stringify({
        filter: { and: [
          { property: 'Slug',      rich_text: { equals: slug } },
          { property: 'Published', checkbox:  { equals: true } },
        ]},
      }),
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.results.length) return null
    return extractPost(data.results[0])
  } catch (e) { console.error('[Notion] getPostBySlug error:', e); return null }
}

export async function getAllSlugs(): Promise<string[]> {
  const posts = await getPosts()
  return posts.map(p => p.slug).filter(Boolean)
}

export async function getBlocks(pageId: string): Promise<NotionBlock[]> {
  try {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
      headers, next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.results
  } catch (e) { console.error('[Notion] getBlocks error:', e); return [] }
}