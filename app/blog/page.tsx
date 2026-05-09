import { getPosts, Post } from '@/lib/notion'
import Link from 'next/link'
import Image from 'next/image'

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
      <article style={{
        background: 'var(--light)', border: '1px solid var(--border-light)',
        padding: '2rem 1.75rem', height: '100%',
        transition: 'transform 0.22s cubic-bezier(0.16,1,0.3,1), box-shadow 0.22s ease, border-color 0.22s ease',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.9rem',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-5px)'
          el.style.boxShadow = '0 16px 40px rgba(13,53,52,0.12)'
          el.style.borderColor = 'var(--accent-light)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
          el.style.borderColor = 'var(--border-light)'
        }}
      >
        {post.cover && (
          <div style={{ width: '100%', height: '180px', overflow: 'hidden', marginBottom: '0.25rem' }}>
            <Image src={post.cover} alt={post.title} width={400} height={180}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 500,
          letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)',
        }}>
          {formatDate(post.date)}
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 400,
          fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', lineHeight: 1.25,
          color: 'var(--dark)', letterSpacing: '-0.01em',
        }}>
          {post.title}
        </h2>
        {post.excerpt && (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '0.92rem',
            color: 'var(--text-mid)', lineHeight: 1.75, flex: 1,
          }}>
            {post.excerpt}
          </p>
        )}
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 500,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: 'var(--accent)', marginTop: 'auto', paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-light)',
        }}>
          Read →
        </p>
      </article>
    </Link>
  )
}

export default async function BlogIndex() {
  const posts = await getPosts()

  return (
    <>
      {/* Nav spacer */}
      <div style={{ height: '64px' }} />

      {/* Header */}
      <section style={{ background: 'var(--light)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 5rem)' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--accent)', marginBottom: '1rem',
          }}>
            From Keelbase
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 300,
            fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: 1.1,
            letterSpacing: '-0.02em', color: 'var(--dark)', maxWidth: '640px',
          }}>
            Ideas for the founder<br />
            <em>building something real.</em>
          </h1>
        </div>
      </section>

      {/* Posts grid */}
      <section style={{ background: 'var(--light)', padding: 'clamp(4rem, 8vw, 7rem) 0' }}>
        <div className="container" style={{ padding: '0 clamp(1.5rem, 5vw, 5rem)' }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '0.88rem',
                color: 'var(--text-muted)', letterSpacing: '0.04em',
              }}>
                The first piece is almost ready.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1.5rem',
            }}
              className="blog-grid"
            >
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--dark)', borderTop: '1px solid var(--border-dark)', padding: '2rem 0' }}>
        <div className="container" style={{
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

      <style>{`
        @media (max-width: 768px) {
          .blog-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .blog-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </>
  )
}