// app/blog/page.tsx
// Drop-in replacement. No new dependencies. Uses existing globals.css variables + fonts.
// Add NOTION_BLOG_DATABASE_ID to your Vercel env vars (separate from NOTION_DATABASE_ID).

import { getPosts, Post } from '@/lib/notion'
import Link from 'next/link'
import Image from 'next/image'

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

// ── Featured post card (top of page, horizontal layout) ──────────────────────
function FeaturedCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className="featured-card" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        border: '1px solid var(--border-light)',
        background: 'var(--light)',
        overflow: 'hidden',
        transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease, border-color 0.35s ease',
        cursor: 'pointer',
      }}>
        {/* Art panel */}
        <div style={{
          aspectRatio: '5/4',
          background: 'var(--dark)',
          borderRight: '1px solid var(--border-light)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {post.cover ? (
            <Image src={post.cover} alt={post.title} fill
              style={{ objectFit: 'cover', opacity: 0.85 }} />
          ) : (
            // Default SVG illustration — abstract keel
            <svg viewBox="0 0 600 480" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
              preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="fg" cx="0.5" cy="0.45" r="0.5">
                  <stop offset="0%" stopColor="#1a6b68" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1a6b68" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect width="600" height="480" fill="#0d3534" />
              <rect width="600" height="480" fill="url(#fg)" />
              <line x1="0" y1="240" x2="600" y2="240" stroke="#2a8a86" strokeWidth="0.6" opacity="0.3" />
              <g stroke="#c9b896" strokeWidth="0.4" opacity="0.12">
                <line x1="0" y1="280" x2="600" y2="280" />
                <line x1="0" y1="320" x2="600" y2="320" />
                <line x1="0" y1="360" x2="600" y2="360" />
              </g>
              <path d="M 50,240 Q 300,262 550,242" stroke="#b8d4d3" strokeWidth="1.2" fill="none" opacity="0.6" />
              <path d="M 80,262 Q 300,330 520,264" stroke="#2a8a86" strokeWidth="1" fill="none" opacity="0.5" />
              <g fill="#b8d4d3" opacity="0.7">
                {[200,240,280,320,360,400].map((cx, i) => (
                  <circle key={i} cx={cx} cy={295} r="1.5" />
                ))}
              </g>
              <circle cx="300" cy="158" r="3.5" fill="#2a8a86" />
              <circle cx="300" cy="158" r="12" fill="none" stroke="#2a8a86" strokeWidth="0.5" opacity="0.5" />
              <line x1="300" y1="162" x2="300" y2="293" stroke="#2a8a86" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />
              <g fill="#f4f9f9" opacity="0.4">
                <circle cx="90" cy="64" r="0.8" /><circle cx="180" cy="96" r="0.6" />
                <circle cx="310" cy="52" r="0.7" /><circle cx="470" cy="74" r="0.6" />
              </g>
              <text x="40" y="448" fill="#b8d4d3" fontFamily="monospace" fontSize="9"
                letterSpacing="3" opacity="0.5">JOURNAL · 001</text>
            </svg>
          )}
        </div>

        {/* Body panel */}
        <div style={{
          padding: 'clamp(2.5rem, 4vw, 3.5rem) clamp(2rem, 4vw, 3.5rem)',
          display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '0.62rem', fontWeight: 500,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'var(--light)', background: 'var(--accent)',
                padding: '4px 10px',
              }}>
                First piece
              </span>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '0.68rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}>
                {formatDate(post.date)}
              </span>
            </div>

            <h2 style={{
              fontFamily: 'var(--font-display)', fontWeight: 300,
              fontSize: 'clamp(1.4rem, 2.8vw, 2rem)', lineHeight: 1.12,
              letterSpacing: '-0.02em', color: 'var(--dark)',
            }}>
              {post.title}
            </h2>

            {post.excerpt && (
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: '0.95rem',
                color: 'var(--text-mid)', lineHeight: 1.75,
              }}>
                {post.excerpt}
              </p>
            )}
          </div>

          <span className="featured-read-link" style={{
            fontFamily: 'var(--font-display)', fontSize: '0.75rem', fontWeight: 500,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            borderBottom: '1px solid var(--border-light)', paddingBottom: '0.35rem',
            alignSelf: 'flex-start', transition: 'gap 0.3s, border-color 0.3s',
          }}>
            Read the piece <span aria-hidden="true">→</span>
          </span>
        </div>
      </article>
    </Link>
  )
}

// ── Post row (list below the featured) ───────────────────────────────────────
function PostRow({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article className="post-row" style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr 48px',
        gap: '2.5rem',
        alignItems: 'center',
        borderTop: '1px solid var(--border-light)',
        padding: '2.25rem 0',
        transition: 'background 0.3s',
        cursor: 'pointer',
        position: 'relative',
      }}>
        {/* Thumbnail */}
        <div style={{
          aspectRatio: '5/3',
          background: 'var(--dark)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          {post.cover ? (
            <Image src={post.cover} alt={post.title} fill style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, var(--dark) 0%, var(--dark-soft) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '0.6rem',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'var(--text-light-dim)', opacity: 0.5,
              }}>
                Keelbase
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)',
          }}>
            {formatDate(post.date)}{post.author && post.author !== 'Keelbase' ? ` · ${post.author}` : ''}
          </p>
          <h3 style={{
            fontFamily: 'var(--font-display)', fontWeight: 300,
            fontSize: 'clamp(1.1rem, 2vw, 1.45rem)', lineHeight: 1.2,
            letterSpacing: '-0.015em', color: 'var(--dark)',
          }}>
            {post.title}
          </h3>
          {post.excerpt && (
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: '0.9rem',
              color: 'var(--text-mid)', lineHeight: 1.7,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            }}>
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Arrow */}
        <span className="post-arrow" style={{
          fontFamily: 'var(--font-display)', fontSize: '1.4rem',
          color: 'var(--text-muted)', textAlign: 'right',
          transition: 'transform 0.3s, color 0.3s',
        }}>
          →
        </span>
      </article>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogIndex() {
  const posts = await getPosts()
  const [featured, ...rest] = posts

  return (
    <>
      <style>{`
        /* Nav — static server version (no scroll hooks needed) */
        .blog-nav-link {
          font-family: var(--font-display); font-weight: 400;
          font-size: 0.82rem; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--text-mid); text-decoration: none; transition: color 0.2s;
        }
        .blog-nav-link:hover { color: var(--dark); }
        .blog-nav-link.active { color: var(--dark); font-weight: 500; }

        .blog-nav-desktop { display: flex; align-items: center; gap: 2.5rem; }
        .blog-nav-hamburger { display: none; }

        .featured-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 60px rgba(13,53,52,0.12);
          border-color: var(--accent-light) !important;
        }
        .featured-card:hover .featured-read-link {
          gap: 0.9rem !important;
          border-color: var(--accent) !important;
        }
        .post-row:hover { background: rgba(26,107,104,0.03); }
        .post-row:hover .post-arrow {
          transform: translateX(6px);
          color: var(--accent) !important;
        }
        .post-row:last-of-type { border-bottom: 1px solid var(--border-light); }

        /* Section label style */
        .section-rule {
          display: flex; align-items: center; gap: 1.25rem;
          font-family: var(--font-display); font-size: 0.65rem; font-weight: 500;
          letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-muted);
          margin-bottom: 0; white-space: nowrap;
        }
        .section-rule::before { content: ''; width: 24px; height: 1px; background: var(--accent); }
        .section-rule::after  { content: ''; flex: 1; height: 1px; background: var(--border-light); }

        @media (max-width: 768px) {
          .blog-nav-desktop  { display: none !important; }
          .blog-nav-hamburger { display: flex !important; }
          .featured-card { grid-template-columns: 1fr !important; }
          .featured-card > div:first-child { border-right: none !important; border-bottom: 1px solid var(--border-light); aspect-ratio: 16/9 !important; }
          .post-row { grid-template-columns: 1fr !important; gap: 1rem !important; }
          .post-arrow { display: none !important; }
        }
      `}</style>

      {/* ── Nav (static — matches homepage nav visually, no client JS needed) ── */}
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

      {/* Nav spacer */}
      <div style={{ height: '64px' }} />

      {/* ── Page header ── */}
      <section style={{
        background: 'var(--light)',
        borderBottom: '1px solid var(--border-light)',
        padding: 'clamp(4rem, 8vw, 7rem) 0 clamp(3rem, 6vw, 5rem)',
      }}>
        <div className="container">
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 500,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--accent)', marginBottom: '1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <span style={{ display: 'inline-block', width: '20px', height: '1px', background: 'var(--accent)', verticalAlign: 'middle' }} />
            From Keelbase
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 300,
            fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', lineHeight: 1.08,
            letterSpacing: '-0.025em', color: 'var(--dark)', maxWidth: '760px',
            marginBottom: '1.5rem',
          }}>
            Ideas for the founder<br />
            <em style={{ fontStyle: 'italic', color: 'var(--accent)' }}>building something real.</em>
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)', fontStyle: 'italic',
            fontSize: 'clamp(1rem, 1.5vw, 1.1rem)',
            color: 'var(--text-mid)', lineHeight: 1.7, maxWidth: '540px',
          }}>
            Essays on how small businesses get built now that the work about the work no longer needs the founder.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section style={{ background: 'var(--light)', padding: 'clamp(3.5rem, 7vw, 6rem) 0' }}>
        <div className="container">

          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontStyle: 'italic',
                fontSize: '1.1rem', color: 'var(--text-muted)',
              }}>
                The first piece is almost ready.
              </p>
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured && (
                <div style={{ marginBottom: 'clamp(4rem, 7vw, 6rem)' }}>
                  <FeaturedCard post={featured} />
                </div>
              )}

              {/* All entries label + list */}
              {rest.length > 0 && (
                <>
                  <div style={{ marginBottom: '0', paddingBottom: '0' }}>
                    <div className="section-rule" style={{ marginBottom: '0' }}>
                      All entries
                      <span style={{
                        marginLeft: 'auto',
                        fontFamily: 'var(--font-display)', fontSize: '0.65rem',
                        color: 'var(--text-muted)', letterSpacing: '0.12em',
                      }}>
                        {posts.length.toString().padStart(3, '0')} · published
                      </span>
                    </div>
                  </div>

                  <div>
                    {rest.map(post => (
                      <PostRow key={post.id} post={post} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Closing line ── */}
      <section style={{
        background: 'var(--light)',
        borderTop: '1px solid var(--border-light)',
        padding: 'clamp(3rem, 5vw, 4.5rem) 0',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontStyle: 'italic', fontWeight: 400,
          fontSize: 'clamp(1.1rem, 2vw, 1.4rem)',
          color: 'var(--text-muted)',
        }}>
          Every company needs a keel.
        </p>
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
              { label: 'keelbase.io',      href: 'https://www.keelbase.io' },
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