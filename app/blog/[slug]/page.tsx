import { getPostBySlug, getAllSlugs, getBlocks, NotionBlock } from '@/lib/notion'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function getRichTextContent(richText: Array<{ plain_text: string; annotations?: { bold?: boolean; italic?: boolean; code?: boolean }; href?: string | null }>): string {
  return richText?.map(t => t.plain_text).join('') ?? ''
}

function renderBlock(block: NotionBlock): React.ReactNode {
  const type = block.type
  const content = block[type] as { rich_text?: Array<{ plain_text: string; annotations?: { bold?: boolean; italic?: boolean; code?: boolean }; href?: string | null }>; url?: string; caption?: Array<{ plain_text: string }>; language?: string }

  const baseParaStyle = {
    fontFamily: 'var(--font-body)',
    fontSize: '1.05rem',
    color: 'var(--text-mid)',
    lineHeight: 1.85,
    marginBottom: '1.5rem',
  }

  switch (type) {
    case 'paragraph':
      return (
        <p key={block.id} style={baseParaStyle}>
          {getRichTextContent(content?.rich_text ?? [])}
        </p>
      )

    case 'heading_1':
      return (
        <h1 key={block.id} style={{
          fontFamily: 'var(--font-display)', fontWeight: 400,
          fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', lineHeight: 1.2,
          color: 'var(--dark)', letterSpacing: '-0.01em',
          marginTop: '3rem', marginBottom: '1.25rem',
        }}>
          {getRichTextContent(content?.rich_text ?? [])}
        </h1>
      )

    case 'heading_2':
      return (
        <h2 key={block.id} style={{
          fontFamily: 'var(--font-display)', fontWeight: 400,
          fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)', lineHeight: 1.25,
          color: 'var(--dark)', letterSpacing: '-0.01em',
          marginTop: '2.5rem', marginBottom: '1rem',
        }}>
          {getRichTextContent(content?.rich_text ?? [])}
        </h2>
      )

    case 'heading_3':
      return (
        <h3 key={block.id} style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: '1rem', letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--accent)', marginTop: '2rem', marginBottom: '0.75rem',
        }}>
          {getRichTextContent(content?.rich_text ?? [])}
        </h3>
      )

    case 'bulleted_list_item':
      return (
        <li key={block.id} style={{ ...baseParaStyle, marginBottom: '0.5rem' }}>
          {getRichTextContent(content?.rich_text ?? [])}
        </li>
      )

    case 'numbered_list_item':
      return (
        <li key={block.id} style={{ ...baseParaStyle, marginBottom: '0.5rem' }}>
          {getRichTextContent(content?.rich_text ?? [])}
        </li>
      )

    case 'quote':
      return (
        <blockquote key={block.id} style={{
          borderLeft: '3px solid var(--accent)',
          paddingLeft: '1.5rem', marginLeft: 0,
          marginBottom: '1.75rem',
        }}>
          <p style={{ ...baseParaStyle, marginBottom: 0, fontStyle: 'italic', color: 'var(--dark)' }}>
            {getRichTextContent(content?.rich_text ?? [])}
          </p>
        </blockquote>
      )

    case 'code':
      return (
        <pre key={block.id} style={{
          background: 'var(--surface, #1a1a17)', color: 'var(--text, #e8e4d9)',
          padding: '1.25rem 1.5rem', overflowX: 'auto',
          fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.7,
          marginBottom: '1.75rem',
        }}>
          <code>{getRichTextContent(content?.rich_text ?? [])}</code>
        </pre>
      )

    case 'divider':
      return <hr key={block.id} style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '2.5rem 0' }} />

    case 'image': {
      const imgContent = block[type] as { type: string; external?: { url: string }; file?: { url: string }; caption?: Array<{ plain_text: string }> }
      const url = imgContent?.external?.url ?? imgContent?.file?.url ?? ''
      const caption = imgContent?.caption?.map((t: { plain_text: string }) => t.plain_text).join('') ?? ''
      if (!url) return null
      return (
        <figure key={block.id} style={{ marginBottom: '2rem' }}>
          <Image src={url} alt={caption || 'Image'} width={800} height={450}
            style={{ width: '100%', height: 'auto', display: 'block' }} />
          {caption && (
            <figcaption style={{
              fontFamily: 'var(--font-display)', fontSize: '0.78rem',
              color: 'var(--text-muted)', textAlign: 'center',
              marginTop: '0.75rem', letterSpacing: '0.02em',
            }}>
              {caption}
            </figcaption>
          )}
        </figure>
      )
    }

    case 'callout': {
      const calloutContent = block[type] as { rich_text?: Array<{ plain_text: string }> }
      return (
        <div key={block.id} style={{
          background: 'var(--light-mid, #e8f0f0)',
          border: '1px solid var(--border-light)',
          borderLeft: '3px solid var(--accent)',
          padding: '1.25rem 1.5rem', marginBottom: '1.75rem',
        }}>
          <p style={{ ...baseParaStyle, marginBottom: 0 }}>
            {getRichTextContent(calloutContent?.rich_text ?? [])}
          </p>
        </div>
      )
    }

    default:
      return null
  }
}

function groupListItems(blocks: NotionBlock[]): React.ReactNode[] {
  const result: React.ReactNode[] = []
  let i = 0
  while (i < blocks.length) {
    const block = blocks[i]
    if (block.type === 'bulleted_list_item') {
      const items: React.ReactNode[] = []
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        items.push(renderBlock(blocks[i]))
        i++
      }
      result.push(<ul key={`ul-${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>{items}</ul>)
    } else if (block.type === 'numbered_list_item') {
      const items: React.ReactNode[] = []
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        items.push(renderBlock(blocks[i]))
        i++
      }
      result.push(<ol key={`ol-${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>{items}</ol>)
    } else {
      result.push(renderBlock(block))
      i++
    }
  }
  return result
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const blocks = await getBlocks(post.id)

  return (
    <>
      <div style={{ height: '64px' }} />

      {/* Post header */}
      <section style={{ background: 'var(--light)', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem)' }}>
          <Link href="/blog" style={{
            fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 500,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--accent)', textDecoration: 'none',
            display: 'inline-block', marginBottom: '2.5rem',
            transition: 'color 0.2s',
          }}>
            ← All posts
          </Link>

          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 500,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--text-muted)', marginBottom: '1rem',
          }}>
            {formatDate(post.date)}{post.author ? ` · ${post.author}` : ''}
          </p>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 400,
            fontSize: 'clamp(2rem, 4vw, 3.2rem)', lineHeight: 1.1,
            letterSpacing: '-0.02em', color: 'var(--dark)',
            marginBottom: post.excerpt ? '1.5rem' : '0',
          }}>
            {post.title}
          </h1>

          {post.excerpt && (
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '1.15rem',
              color: 'var(--text-mid)', lineHeight: 1.7,
              fontStyle: 'italic',
            }}>
              {post.excerpt}
            </p>
          )}
        </div>
      </section>

      {/* Cover image */}
      {post.cover && (
        <div style={{ background: 'var(--light)', maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 3rem)' }}>
          <Image src={post.cover} alt={post.title} width={720} height={400}
            style={{ width: '100%', height: 'auto', display: 'block', borderBottom: '1px solid var(--border-light)' }} />
        </div>
      )}

      {/* Post body */}
      <section style={{ background: 'var(--light)', padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 3rem)' }}>
          {groupListItems(blocks)}
        </div>
      </section>

      {/* Back link */}
      <section style={{ background: 'var(--light)', borderTop: '1px solid var(--border-light)', padding: '3rem 0' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 3rem)' }}>
          <Link href="/blog" style={{
            fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 500,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--accent)', textDecoration: 'none',
          }}>
            ← Back to all posts
          </Link>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section style={{ background: 'var(--dark)', padding: 'clamp(4rem, 8vw, 6rem) 0' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 3rem)', textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--accent-dim)', marginBottom: '1.25rem',
          }}>
            Early Access
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 300,
            fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', lineHeight: 1.2,
            color: 'var(--text-light)', marginBottom: '2rem',
          }}>
            Ready to build your Vessel?
          </h2>
          <Link href="/#waitlist" className="btn btn-primary-light">
            Request access →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--dark)', borderTop: '1px solid var(--border-dark)', padding: '2rem 0' }}>
        <div style={{
          maxWidth: '1160px', margin: '0 auto',
          padding: '0 clamp(1.5rem, 5vw, 5rem)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-light-dim)' }}>
              Every company needs a keel.
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', letterSpacing: '0.06em', color: 'var(--text-light-dim)', opacity: 0.6 }}>
              © 2026 Keelbase
            </p>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {[
              { label: 'keelbase.io',      href: 'https://keelbase.io' },
              { label: '@keelbase',        href: 'https://twitter.com/keelbase' },
              { label: 'ahoy@keelbase.io', href: 'mailto:ahoy@keelbase.io' },
            ].map(link => (
              <a key={link.label} href={link.href} style={{
                fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.06em',
                color: 'var(--text-light-dim)', textDecoration: 'none', transition: 'color 0.2s',
              }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  )
}