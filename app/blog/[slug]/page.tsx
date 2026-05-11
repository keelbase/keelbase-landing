// app/blog/[slug]/page.tsx
// Drop-in replacement. No new dependencies.

import { getPostBySlug, getAllSlugs, getBlocks, NotionBlock } from '@/lib/notion'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return {}
  return {
    title: `${post.title} — Keelbase Journal`,
    description: post.excerpt || 'An essay from Keelbase.',
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.cover ? [post.cover] : ['/og-image.png'],
    },
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── Rich text renderer — handles bold, italic, code, links ───────────────────
type RichTextItem = {
  plain_text: string
  annotations?: { bold?: boolean; italic?: boolean; code?: boolean; strikethrough?: boolean }
  href?: string | null
}

function RichText({ items }: { items: RichTextItem[] }) {
  return (
    <>
      {items.map((item, i) => {
        let node: React.ReactNode = item.plain_text
        if (item.annotations?.code) {
          node = (
            <code key={i} style={{
              fontFamily: 'monospace', fontSize: '0.88em',
              background: 'var(--light-mid)', padding: '2px 6px',
              border: '1px solid var(--border-light)',
            }}>
              {node}
            </code>
          )
        }
        if (item.annotations?.bold)          node = <strong key={i} style={{ fontWeight: 600, color: 'var(--dark)' }}>{node}</strong>
        if (item.annotations?.italic)        node = <em key={i} style={{ fontStyle: 'italic' }}>{node}</em>
        if (item.annotations?.strikethrough) node = <s key={i}>{node}</s>
        if (item.href) {
          node = (
            <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" style={{
              color: 'var(--accent)', textDecoration: 'underline',
              textDecorationColor: 'var(--border-light)', textUnderlineOffset: '3px',
              transition: 'color 0.2s',
            }}>
              {node}
            </a>
          )
        }
        return <span key={i}>{node}</span>
      })}
    </>
  )
}

// ── Block renderer ────────────────────────────────────────────────────────────
const baseParaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'clamp(1rem, 1.3vw, 1.08rem)',
  color: 'var(--text-mid)',
  lineHeight: 1.88,
  marginBottom: '1.6rem',
}

function renderBlock(block: NotionBlock, index: number): React.ReactNode {
  const type = block.type
  const content = block[type] as {
    rich_text?: RichTextItem[]
    url?: string
    caption?: RichTextItem[]
    language?: string
    external?: { url: string }
    file?: { url: string }
  }
  const rt = content?.rich_text ?? []

  switch (type) {
    case 'paragraph':
      if (!rt.length) return <div key={block.id} style={{ height: '0.8rem' }} />
      return (
        <p key={block.id} style={{
          ...baseParaStyle,
          // First paragraph in body gets special lede treatment (handled by CSS class below)
        }} className={index === 0 ? 'post-lede' : ''}>
          <RichText items={rt} />
        </p>
      )

    case 'heading_1':
      return (
        <h1 key={block.id} style={{
          fontFamily: 'var(--font-display)', fontWeight: 300,
          fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', lineHeight: 1.15,
          letterSpacing: '-0.02em', color: 'var(--dark)',
          marginTop: '3.5rem', marginBottom: '1.25rem',
        }}>
          <RichText items={rt} />
        </h1>
      )

    case 'heading_2':
      return (
        <h2 key={block.id} style={{
          fontFamily: 'var(--font-display)', fontWeight: 300,
          fontSize: 'clamp(1.4rem, 2.4vw, 1.85rem)', lineHeight: 1.2,
          letterSpacing: '-0.015em', color: 'var(--dark)',
          marginTop: '3rem', marginBottom: '1rem',
        }}>
          <RichText items={rt} />
        </h2>
      )

    case 'heading_3':
      return (
        <h3 key={block.id} style={{
          fontFamily: 'var(--font-display)', fontWeight: 500,
          fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--accent)', marginTop: '2.25rem', marginBottom: '0.75rem',
        }}>
          <RichText items={rt} />
        </h3>
      )

    case 'quote':
      return (
        <blockquote key={block.id} style={{
          borderLeft: '2px solid var(--accent)',
          paddingLeft: '1.75rem', marginLeft: 0,
          marginTop: '2rem', marginBottom: '2rem',
        }}>
          <p style={{ ...baseParaStyle, marginBottom: 0, fontStyle: 'italic', color: 'var(--dark)', fontSize: 'clamp(1.05rem, 1.5vw, 1.2rem)' }}>
            <RichText items={rt} />
          </p>
        </blockquote>
      )

    case 'divider':
      return (
        <div key={block.id} style={{
          textAlign: 'center', margin: '3rem 0',
          fontFamily: 'var(--font-body)', fontSize: '1rem',
          color: 'var(--text-muted)', letterSpacing: '0.5em',
          paddingLeft: '0.5em',
        }}>
          · · ·
        </div>
      )

    case 'code':
      return (
        <pre key={block.id} style={{
          background: 'var(--dark)', color: 'var(--text-light-mid)',
          padding: '1.25rem 1.5rem', overflowX: 'auto',
          fontFamily: 'monospace', fontSize: '0.88rem', lineHeight: 1.7,
          marginBottom: '1.75rem', border: '1px solid var(--border-dark)',
        }}>
          <code><RichText items={rt} /></code>
        </pre>
      )

    case 'image': {
      const imgContent = block[type] as { type: string; external?: { url: string }; file?: { url: string }; caption?: RichTextItem[] }
      const url = imgContent?.external?.url ?? imgContent?.file?.url ?? ''
      const caption = imgContent?.caption?.map(t => t.plain_text).join('') ?? ''
      if (!url) return null
      return (
        <figure key={block.id} style={{ margin: '2.5rem 0' }}>
          <Image src={url} alt={caption || 'Image'} width={720} height={405}
            style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--border-light)' }} />
          {caption && (
            <figcaption style={{
              fontFamily: 'var(--font-display)', fontSize: '0.72rem',
              color: 'var(--text-muted)', textAlign: 'center',
              marginTop: '0.75rem', letterSpacing: '0.04em',
            }}>
              {caption}
            </figcaption>
          )}
        </figure>
      )
    }

    case 'callout': {
      const calloutContent = block[type] as { rich_text?: RichTextItem[] }
      return (
        <div key={block.id} style={{
          background: 'var(--light-mid)',
          border: '1px solid var(--border-light)',
          borderLeft: '2px solid var(--accent)',
          padding: '1.25rem 1.5rem', marginBottom: '1.75rem',
        }}>
          <p style={{ ...baseParaStyle, marginBottom: 0 }}>
            <RichText items={calloutContent?.rich_text ?? []} />
          </p>
        </div>
      )
    }

    case 'bulleted_list_item':
    case 'numbered_list_item':
      return (
        <li key={block.id} style={{ ...baseParaStyle, marginBottom: '0.5rem' }}>
          <RichText items={rt} />
        </li>
      )

    default:
      return null
  }
}

// ── Group consecutive list items into <ul>/<ol> ───────────────────────────────
function groupBlocks(blocks: NotionBlock[]): React.ReactNode[] {
  const result: React.ReactNode[] = []
  let i = 0
  let bodyIndex = 0 // track paragraph index for lede class

  while (i < blocks.length) {
    const block = blocks[i]

    if (block.type === 'bulleted_list_item') {
      const items: React.ReactNode[] = []
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        items.push(renderBlock(blocks[i], bodyIndex++))
        i++
      }
      result.push(
        <ul key={`ul-${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
          {items}
        </ul>
      )
    } else if (block.type === 'numbered_list_item') {
      const items: React.ReactNode[] = []
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        items.push(renderBlock(blocks[i], bodyIndex++))
        i++
      }
      result.push(
        <ol key={`ol-${i}`} style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
          {items}
        </ol>
      )
    } else {
      result.push(renderBlock(block, block.type === 'paragraph' ? bodyIndex++ : -1))
      i++
    }
  }
  return result
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const blocks = await getBlocks(post.id)

  return (
    <>
      <style>{`
        .blog-nav-link {
          font-family: var(--font-display); font-weight: 400;
          font-size: 0.82rem; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--text-mid); text-decoration: none; transition: color 0.2s;
        }
        .blog-nav-link:hover { color: var(--dark); }
        .blog-nav-link.active { color: var(--dark); font-weight: 500; }
        .blog-nav-desktop { display: flex; align-items: center; gap: 2.5rem; }

        /* Reading progress bar */
        #reading-progress {
          position: fixed; top: 64px; left: 0; height: 2px;
          background: var(--accent); width: 0%; z-index: 101;
          transition: width 0.08s linear;
        }

        /* Lede — first paragraph larger, with drop cap */
        .post-lede {
          font-size: clamp(1.1rem, 1.6vw, 1.22rem) !important;
          color: var(--dark) !important;
          line-height: 1.78 !important;
          margin-bottom: 2rem !important;
        }
        .post-lede::first-letter {
          font-family: var(--font-display);
          font-size: 4.2em; font-weight: 300;
          float: left; line-height: 0.88;
          margin: 10px 14px 0 0;
          color: var(--accent);
        }

        /* Back link hover */
        .back-link { transition: color 0.2s, gap 0.2s; }
        .back-link:hover { color: var(--dark) !important; }

        /* CTA hover */
        .cta-primary:hover { background: var(--dark-soft) !important; border-color: var(--dark-soft) !important; }
        .cta-ghost:hover { border-color: var(--text-light-dim) !important; color: var(--text-light) !important; }

        /* Share buttons */
        .share-btn { border-radius: 0; }

        @media (max-width: 768px) {
          .blog-nav-desktop { display: none !important; }
          .post-lede::first-letter { font-size: 3.2em; margin-top: 8px; }
          #back-to-top { bottom: 1.25rem; right: 1.25rem; }
        }
      `}</style>

      {/* Reading progress bar (CSS only — no JS needed; actual width driven by scroll via inline script below) */}
      <div id="reading-progress" />

      {/* ── Nav ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(244,249,249,0.94)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border-light)',
        boxShadow: '0 1px 20px rgba(13,53,52,0.06)',
      }}>
        <div className="container" style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', height: '64px',
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Image src="/logo.png" alt="Keelbase" width={160} height={40}
              style={{ objectFit: 'contain', height: '32px', width: 'auto' }} priority />
          </a>
          <div className="blog-nav-desktop">
            <div style={{ display: 'flex', gap: '2rem' }}>
              <a href="/#vessel"       className="blog-nav-link">The Vessel</a>
              <a href="/#how-it-works" className="blog-nav-link">How it Works</a>
              <a href="/blog"          className="blog-nav-link active">Journal</a>
            </div>
            <a href="/#waitlist" className="btn btn-primary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.75rem' }}>
              Request Access
            </a>
          </div>
        </div>
      </nav>

      <div style={{ height: '64px' }} />

      {/* ── Post header ── */}
      <section style={{
        background: 'var(--light)',
        borderBottom: '1px solid var(--border-light)',
        padding: 'clamp(3.5rem, 7vw, 6rem) 0 clamp(2.5rem, 5vw, 4rem)',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 3rem)' }}>
          <Link href="/blog" className="back-link" style={{
            fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--accent)', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            marginBottom: '2.5rem',
          }}>
            ← Journal
          </Link>

          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--text-muted)', marginBottom: '1.1rem',
          }}>
            {formatDate(post.date)}{post.author && post.author !== 'Keelbase' ? ` · ${post.author}` : ''}
          </p>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 300,
            fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', lineHeight: 1.08,
            letterSpacing: '-0.025em', color: 'var(--dark)',
            marginBottom: post.excerpt ? '1.5rem' : '0',
          }}>
            {post.title}
          </h1>

          {post.excerpt && (
            <p style={{
              fontFamily: 'var(--font-body)', fontStyle: 'italic',
              fontSize: 'clamp(1.05rem, 1.4vw, 1.15rem)',
              color: 'var(--text-mid)', lineHeight: 1.7,
              borderTop: '1px solid var(--border-light)',
              paddingTop: '1.25rem', marginTop: '1.25rem',
            }}>
              {post.excerpt}
            </p>
          )}
        </div>
      </section>

      {/* ── Cover image (if present) ── */}
      {post.cover && (
        <div style={{
          maxWidth: '720px', margin: '0 auto',
          padding: '0 clamp(1.5rem, 5vw, 3rem)',
          background: 'var(--light)',
        }}>
          <Image src={post.cover} alt={post.title} width={720} height={405}
            style={{ width: '100%', height: 'auto', display: 'block', borderBottom: '1px solid var(--border-light)' }} />
        </div>
      )}

      {/* ── Post body ── */}
      <section style={{ background: 'var(--light)', padding: 'clamp(3rem, 6vw, 5rem) 0' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 clamp(1.5rem, 5vw, 3rem)' }}>
          {groupBlocks(blocks)}
        </div>
      </section>

      {/* ── Closing tagline ── */}
      <section style={{
        background: 'var(--light)',
        borderTop: '1px solid var(--border-light)',
        padding: '2.5rem 0',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic',
          fontSize: '1rem', color: 'var(--text-muted)',
        }}>
          Every company needs a keel.
        </p>
      </section>

      {/* ── Social sharing + AI reference ── */}
      <section style={{
        background: 'var(--light)',
        borderTop: '1px solid var(--border-light)',
        padding: 'clamp(2rem, 4vw, 3rem) 0',
      }}>
        <div style={{
          maxWidth: '720px', margin: '0 auto',
          padding: '0 clamp(1.5rem, 5vw, 3rem)',
          display: 'flex', flexDirection: 'column', gap: '1.75rem',
        }}>

          {/* Share row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 500,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)',
              marginRight: '0.25rem',
            }}>
              Share
            </span>

            {/* X / Twitter */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://keelbase.io/blog/${post.slug}`)}&via=keelbase`}
              target="_blank" rel="noopener noreferrer"
              className="share-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 500,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--text-mid)', textDecoration: 'none',
                border: '1px solid var(--border-light)',
                padding: '0.5rem 0.9rem',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              aria-label="Share on X"
            >
              {/* X icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X
            </a>

            {/* LinkedIn */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://keelbase.io/blog/${post.slug}`)}`}
              target="_blank" rel="noopener noreferrer"
              className="share-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 500,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--text-mid)', textDecoration: 'none',
                border: '1px solid var(--border-light)',
                padding: '0.5rem 0.9rem',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              aria-label="Share on LinkedIn"
            >
              {/* LinkedIn icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>

            {/* Copy link — needs minimal client JS */}
            <button
              id="copy-link-btn"
              className="share-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 500,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--text-mid)',
                border: '1px solid var(--border-light)',
                padding: '0.5rem 0.9rem',
                background: 'transparent', cursor: 'pointer',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              aria-label="Copy link"
            >
              {/* Link icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
              <span id="copy-link-label">Copy link</span>
            </button>
          </div>

          {/* AI reference line */}
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.65rem',
            letterSpacing: '0.06em', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
          }}>
            <span style={{ opacity: 0.6 }}>AI reference</span>
            <span style={{ color: 'var(--border-light)' }}>·</span>
            <a
              href={`/blog/${post.slug}/llms.txt`}
              style={{
                color: 'var(--accent)', textDecoration: 'none',
                fontFamily: 'monospace', fontSize: '0.7rem',
                transition: 'opacity 0.2s',
              }}
            >
              {`keelbase.io/blog/${post.slug}/llms.txt`}
            </a>
          </p>

        </div>
      </section>

      {/* ── Back ── */}
      <section style={{
        background: 'var(--light)',
        borderTop: '1px solid var(--border-light)',
        padding: 'clamp(2rem, 4vw, 3rem) 0',
      }}>
        <div style={{
          maxWidth: '720px', margin: '0 auto',
          padding: '0 clamp(1.5rem, 5vw, 3rem)',
        }}>
          <Link href="/blog" style={{
            fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 500,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--accent)', textDecoration: 'none',
          }}>
            ← All entries
          </Link>
        </div>
      </section>

      {/* ── Back to top button (fixed, appears after scroll) ── */}
      <button
        id="back-to-top"
        aria-label="Back to top"
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '44px', height: '44px',
          background: 'var(--dark)', border: '1px solid var(--border-dark)',
          color: 'var(--text-light)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, pointerEvents: 'none',
          transition: 'opacity 0.3s, transform 0.3s, background 0.2s',
          transform: 'translateY(8px)',
          zIndex: 50,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 15l-6-6-6 6"/>
        </svg>
      </button>

      {/* ── Waitlist CTA section ── */}
      <section style={{ background: 'var(--dark)', padding: 'clamp(4rem, 8vw, 6rem) 0' }}>
        <div style={{
          maxWidth: '680px', margin: '0 auto',
          padding: '0 clamp(1.5rem, 5vw, 3rem)',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 500,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--accent-dim)', marginBottom: '1.25rem',
          }}>
            Early Access
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 300,
            fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', lineHeight: 1.18,
            color: 'var(--text-light)', marginBottom: '2rem',
          }}>
            Ready to build your Vessel?
          </h2>
          <Link href="/#waitlist" className="btn btn-primary-light cta-primary">
            Request access →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: 'var(--dark)',
        borderTop: '1px solid var(--border-dark)',
        padding: '2rem 0',
      }}>
        <div className="container" style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '1rem',
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

      {/* Inline scripts — reading progress, back to top, copy link, share hover */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function(){
          // Reading progress bar
          var bar = document.getElementById('reading-progress');
          var btt = document.getElementById('back-to-top');

          function update() {
            var h = document.documentElement;
            var scrolled = h.scrollTop;
            var total = h.scrollHeight - h.clientHeight;
            var pct = total > 0 ? (scrolled / total * 100) : 0;

            if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + '%';

            // Back to top — show after 400px scroll
            if (btt) {
              if (scrolled > 400) {
                btt.style.opacity = '1';
                btt.style.pointerEvents = 'auto';
                btt.style.transform = 'translateY(0)';
              } else {
                btt.style.opacity = '0';
                btt.style.pointerEvents = 'none';
                btt.style.transform = 'translateY(8px)';
              }
            }
          }

          window.addEventListener('scroll', update, { passive: true });
          update();

          // Back to top click
          if (btt) {
            btt.addEventListener('click', function() {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            btt.addEventListener('mouseenter', function() {
              btt.style.background = 'var(--accent)';
              btt.style.borderColor = 'var(--accent)';
            });
            btt.addEventListener('mouseleave', function() {
              btt.style.background = 'var(--dark)';
              btt.style.borderColor = 'var(--border-dark)';
            });
          }

          // Copy link button
          var copyBtn = document.getElementById('copy-link-btn');
          var copyLabel = document.getElementById('copy-link-label');
          if (copyBtn && copyLabel) {
            copyBtn.addEventListener('click', function() {
              navigator.clipboard.writeText(window.location.href).then(function() {
                copyLabel.textContent = 'Copied';
                copyBtn.style.borderColor = 'var(--accent)';
                copyBtn.style.color = 'var(--accent)';
                setTimeout(function() {
                  copyLabel.textContent = 'Copy link';
                  copyBtn.style.borderColor = 'var(--border-light)';
                  copyBtn.style.color = 'var(--text-mid)';
                }, 2000);
              });
            });
          }

          // Share button hover states
          document.querySelectorAll('.share-btn').forEach(function(btn) {
            btn.addEventListener('mouseenter', function() {
              btn.style.borderColor = 'var(--accent)';
              btn.style.color = 'var(--dark)';
            });
            btn.addEventListener('mouseleave', function() {
              btn.style.borderColor = 'var(--border-light)';
              btn.style.color = 'var(--text-mid)';
            });
          });
        })();
      `}} />
    </>
  )
}