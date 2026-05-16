// app/blog/[slug]/llms.txt/route.ts
// Generates a per-post llms.txt on the fly from Notion.
// Every post gets https://www.keelbase.io/blog/[slug]/llms.txt automatically.
// No manual updates needed when new posts are published.

import { getPostBySlug, getBlocks, NotionBlock } from '@/lib/notion'
import { NextRequest } from 'next/server'

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

type RichTextItem = {
  plain_text: string
  annotations?: { bold?: boolean; italic?: boolean; code?: boolean }
  href?: string | null
}

function richTextToMarkdown(items: RichTextItem[]): string {
  return items.map(item => {
    let text = item.plain_text
    if (item.annotations?.code)   text = `\`${text}\``
    if (item.annotations?.bold)   text = `**${text}**`
    if (item.annotations?.italic) text = `*${text}*`
    if (item.href)                text = `[${text}](${item.href})`
    return text
  }).join('')
}

function blocksToMarkdown(blocks: NotionBlock[]): string {
  const lines: string[] = []

  for (const block of blocks) {
    const type = block.type
    const content = block[type] as {
      rich_text?: RichTextItem[]
      external?: { url: string }
      file?: { url: string }
      caption?: RichTextItem[]
    }
    const rt = content?.rich_text ?? []
    const text = richTextToMarkdown(rt)

    switch (type) {
      case 'paragraph':
        lines.push(text || '')
        break
      case 'heading_1':
        lines.push(`# ${text}`)
        break
      case 'heading_2':
        lines.push(`## ${text}`)
        break
      case 'heading_3':
        lines.push(`### ${text}`)
        break
      case 'bulleted_list_item':
        lines.push(`- ${text}`)
        break
      case 'numbered_list_item':
        lines.push(`1. ${text}`)
        break
      case 'quote':
        lines.push(`> ${text}`)
        break
      case 'divider':
        lines.push('---')
        break
      case 'code':
        lines.push(`\`\`\`\n${text}\n\`\`\``)
        break
      case 'image': {
        const imgContent = block[type] as { external?: { url: string }; file?: { url: string }; caption?: RichTextItem[] }
        const url = imgContent?.external?.url ?? imgContent?.file?.url ?? ''
        const caption = imgContent?.caption?.map((t: RichTextItem) => t.plain_text).join('') ?? ''
        if (url) lines.push(caption ? `![${caption}](${url})` : `![image](${url})`)
        break
      }
      case 'callout':
        lines.push(`> ${text}`)
        break
      default:
        break
    }
  }

  // Join with double newlines — paragraphs separated, blocks readable
  return lines.join('\n\n')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return new Response('Not found', { status: 404 })
  }

  const blocks = await getBlocks(post.id)
  const body = blocksToMarkdown(blocks)

  const content = [
    `# ${post.title}`,
    '',
    `> Source: https://www.keelbase.io/blog/${post.slug}`,
    `> Published: ${formatDate(post.date)}`,
    post.author && post.author !== 'Keelbase' ? `> Author: ${post.author}` : '> Author: Keelbase',
    '',
    post.excerpt ? `${post.excerpt}\n` : '',
    '---',
    '',
    body,
    '',
    '---',
    '',
    `*From the Keelbase Journal. Full index: https://www.keelbase.io/llms.txt*`,
  ].filter(line => line !== undefined).join('\n')

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
