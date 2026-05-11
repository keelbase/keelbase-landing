'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'

/* ── Scroll reveal hook ─────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            const row = entry.target.closest('.found-row')
            if (row) row.classList.add('found-visible')
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal, .found-heading, .found-body').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

/* ── Nav scroll hook ────────────────────────────────────────────── */
function useNavScroll() {
  useEffect(() => {
    const nav = document.getElementById('main-nav')
    if (!nav) return
    const handler = () => {
      if (window.scrollY > 10) nav.classList.add('nav-scrolled')
      else nav.classList.remove('nav-scrolled')
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])
}

/* ── Typing animation ───────────────────────────────────────────── */
const MESSAGES = [
  { from: 'architect', text: 'Tell me about the business this Vessel will run. What does it do, who does it serve, and what does it produce?' },
  { from: 'founder',   text: 'A boutique M&A advisory for founder-led businesses under $20M. I manage the whole process solo — sourcing, diligence, buyer outreach, closing.' },
  { from: 'architect', text: 'Understood. That maps well to a three-tier crew: deal flow and research, outreach and document production, and buyer relationship tracking. What does success look like in the first ninety days?' },
]

type Msg = { from: string; text: string; done: boolean }

function ArchitectPreview({ mobile = false }: { mobile?: boolean }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [showDots, setShowDots]   = useState(false)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef  = useRef({ msgIndex: 0, charIndex: 0 })

  const clear = () => { if (timerRef.current) clearTimeout(timerRef.current) }

  const typeChar = useCallback(() => {
    const { msgIndex, charIndex } = stateRef.current
    const full  = MESSAGES[msgIndex].text
    const next  = charIndex + 1
    const chunk = full.slice(0, next)
    const done  = next >= full.length
    stateRef.current.charIndex = next

    setMessages(prev => {
      const updated = [...prev]
      updated[updated.length - 1] = { from: MESSAGES[msgIndex].from, text: chunk, done }
      return updated
    })

    if (!done) {
      timerRef.current = setTimeout(typeChar, MESSAGES[msgIndex].from === 'founder' ? 24 : 20)
    } else {
      setShowDots(false)
      stateRef.current.msgIndex += 1
      if (stateRef.current.msgIndex >= MESSAGES.length) {
        timerRef.current = setTimeout(() => {
          stateRef.current = { msgIndex: 0, charIndex: 0 }
          setMessages([])
          setShowDots(false)
          timerRef.current = setTimeout(typeNextMessage, 900)
        }, 3500)
      } else {
        timerRef.current = setTimeout(() => {
          setShowDots(true)
          timerRef.current = setTimeout(typeNextMessage, 900)
        }, 500)
      }
    }
  }, []) // eslint-disable-line

  const typeNextMessage = useCallback(() => {
    const { msgIndex } = stateRef.current
    if (msgIndex >= MESSAGES.length) return
    stateRef.current.charIndex = 0
    setShowDots(false)
    setMessages(prev => [...prev, { from: MESSAGES[msgIndex].from, text: '', done: false }])
    timerRef.current = setTimeout(typeChar, 60)
  }, [typeChar])

  useEffect(() => {
    if (mobile) {
      // Static preview on mobile — just show first message, no animation
      setMessages([{ from: MESSAGES[0].from, text: MESSAGES[0].text, done: true }])
      return
    }
    timerRef.current = setTimeout(typeNextMessage, 1200)
    return () => clear()
  }, [mobile, typeNextMessage])

  return (
    <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <div style={{
        background: 'white', border: '1px solid var(--border-light)',
        padding: '1.25rem', width: '100%',
        boxShadow: '0 8px 40px rgba(13,53,52,0.10)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          paddingBottom: '0.9rem', marginBottom: '0.9rem',
          borderBottom: '1px solid var(--border-light)',
        }}>
          <div style={{
            width: '24px', height: '24px', background: 'var(--dark)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color: 'var(--light)', fontSize: '0.55rem', fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.04em' }}>KB</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-dark)' }}>
            The Architect · Session Preview
          </span>
        </div>

        {/* Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: mobile ? 'auto' : '200px', overflow: 'hidden' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.from === 'founder' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                background: m.from === 'founder' ? 'var(--dark)' : 'var(--light)',
                color: m.from === 'founder' ? 'var(--text-light)' : 'var(--text-dark)',
                border: m.from === 'founder' ? 'none' : '1px solid var(--border-light)',
                padding: '0.55rem 0.75rem', maxWidth: '88%',
                fontSize: '0.74rem', lineHeight: 1.55, fontFamily: 'var(--font-body)',
              }}>
                {m.text}
                {!m.done && <span className="cursor" />}
              </div>
            </div>
          ))}
          {showDots && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: 'var(--light)', border: '1px solid var(--border-light)',
                padding: '0.5rem 0.8rem', display: 'flex', gap: '4px', alignItems: 'center',
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: '5px', height: '5px', borderRadius: '50%',
                    background: 'var(--text-muted)',
                    animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
          {mobile && (
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: '0.65rem',
              letterSpacing: '0.06em', color: 'var(--text-muted)',
              textAlign: 'center', paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-light)', marginTop: '0.25rem',
            }}>
              The conversation continues…
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Inline waitlist ────────────────────────────────────────────── */
function InlineWaitlist() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'done'|'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || status === 'loading') return
    setStatus('loading')
    try {
      const r = await fetch('/api/waitlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, idea: '' }),
      })
      setStatus(r.ok ? 'done' : 'error')
    } catch { setStatus('error') }
  }

  if (status === 'done') return (
    <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.06em', color: 'var(--accent)' }}>
      You&apos;re on the list. The Architect will be in touch.
    </p>
  )

  return (
    <form onSubmit={submit} className="inline-form" style={{ display: 'flex', maxWidth: '460px', width: '100%' }}>
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
        placeholder="Your email address" className="input"
        style={{ flex: 1, borderRight: 'none', minWidth: 0 }} />
      <button type="submit" className="btn btn-primary" disabled={status === 'loading'}
        style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
        {status === 'loading' ? 'Sending…' : 'Join waitlist'}
      </button>
    </form>
  )
}

/* ── Full waitlist form ─────────────────────────────────────────── */
function WaitlistForm() {
  const [email, setEmail]   = useState('')
  const [idea, setIdea]     = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'done'|'error'>('idle')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || status === 'loading') return
    setStatus('loading')
    try {
      const r = await fetch('/api/waitlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, idea }),
      })
      setStatus(r.ok ? 'done' : 'error')
    } catch { setStatus('error') }
  }

  if (status === 'done') return (
    <div style={{ maxWidth: '520px' }}>
      <h2 style={{ color: 'var(--text-light)', marginBottom: '1.25rem' }}>You&apos;re on the list.</h2>
      <p style={{ color: 'var(--text-light-mid)', fontSize: '1.05rem' }}>
        The Architect will be in touch when your cohort opens.<br />
        In the meantime — keep thinking about it.
      </p>
    </div>
  )

  return (
    <form onSubmit={submit} style={{ maxWidth: '520px', width: '100%' }}>
      <div style={{ marginBottom: '1.1rem' }}>
        <label htmlFor="wl-email" className="field-label field-label-dark">Email *</label>
        <input id="wl-email" type="email" required value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com" className="input input-dark" />
      </div>
      <div style={{ marginBottom: '1.75rem' }}>
        <label htmlFor="wl-idea" className="field-label field-label-dark">
          What kind of Vessel are you thinking of building?{' '}
          <span style={{ color: 'var(--text-light-dim)', textTransform: 'none', letterSpacing: 0, fontWeight: 300 }}>(optional)</span>
        </label>
        <textarea id="wl-idea" value={idea} onChange={e => setIdea(e.target.value)}
          placeholder="Describe your idea in a sentence or two…"
          className="input input-dark" />
      </div>
      <button type="submit" className="btn btn-primary-light" disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Request access →'}
      </button>
      {status === 'error' && (
        <p style={{ color: '#e07a72', fontSize: '0.85rem', marginTop: '1rem' }}>
          Something went wrong. Email ahoy@keelbase.io directly.
        </p>
      )}
    </form>
  )
}

/* ── Hamburger icon ─────────────────────────────────────────────── */
function Hamburger({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Toggle menu" style={{
      background: 'none', border: 'none', cursor: 'pointer',
      padding: '0.5rem', display: 'flex', flexDirection: 'column',
      gap: '5px', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{
        display: 'block', width: '22px', height: '1.5px',
        background: 'var(--dark)',
        transition: 'transform 0.25s, opacity 0.25s',
        transform: open ? 'translateY(6.5px) rotate(45deg)' : 'none',
      }} />
      <span style={{
        display: 'block', width: '22px', height: '1.5px',
        background: 'var(--dark)',
        transition: 'opacity 0.25s',
        opacity: open ? 0 : 1,
      }} />
      <span style={{
        display: 'block', width: '22px', height: '1.5px',
        background: 'var(--dark)',
        transition: 'transform 0.25s, opacity 0.25s',
        transform: open ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
      }} />
    </button>
  )
}

/* ── Page ───────────────────────────────────────────────────────── */
export default function Home() {
  useReveal()
  useNavScroll()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on scroll
  useEffect(() => {
    const handler = () => { if (menuOpen) setMenuOpen(false) }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [menuOpen])

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nav-link {
          font-family: var(--font-display); font-weight: 400;
          font-size: 0.82rem; letter-spacing: 0.06em;
          color: var(--text-mid); text-decoration: none;
          text-transform: uppercase; transition: color 0.2s;
        }
        .nav-link:hover { color: var(--dark); }
        .step-row {
          border-top: 1px solid var(--border-dark); padding: 2rem 0;
          display: grid; grid-template-columns: 3.5rem 1fr;
          gap: 1.5rem; align-items: start; transition: background 0.2s;
        }
        .step-row:last-child { border-bottom: 1px solid var(--border-dark); }
        .step-row:hover { background: rgba(255,255,255,0.02); }
        .step-num {
          font-family: var(--font-display); font-weight: 300;
          font-size: 1.5rem; color: var(--accent-dim); line-height: 1; transition: color 0.2s;
        }
        .step-row:hover .step-num { color: var(--accent-light); }
        .found-row {
          display: grid; grid-template-columns: 180px 1fr;
          gap: 2rem; padding: 2rem 0; border-top: 1px solid var(--border-light); align-items: start;
        }
        .found-row:last-child { border-bottom: 1px solid var(--border-light); }

        /* Desktop nav */
        .nav-desktop { display: flex; align-items: center; gap: 2.5rem; }
        .nav-hamburger { display: none; }

        /* Mobile menu dropdown */
        .mobile-menu {
          display: none;
          position: absolute; top: 64px; left: 0; right: 0;
          background: rgba(244,249,249,0.98);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border-light);
          padding: 1rem 0;
          animation: slideDown 0.2s ease both;
          z-index: 99;
        }
        .mobile-menu.open { display: block; }
        .mobile-menu a {
          display: block;
          font-family: var(--font-display); font-weight: 400;
          font-size: 0.9rem; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--text-mid); text-decoration: none;
          padding: 0.9rem 1.5rem;
          border-bottom: 1px solid var(--border-light);
          transition: color 0.2s, background 0.2s;
        }
        .mobile-menu a:hover { color: var(--dark); background: var(--light-mid); }
        .mobile-menu a:last-child {
          border-bottom: none;
          color: var(--dark); font-weight: 500;
          margin: 0.5rem 1.5rem 0.25rem;
          border: 1px solid var(--dark);
          text-align: center;
          padding: 0.8rem 1rem;
        }
        .mobile-menu a:last-child:hover { background: var(--dark); color: var(--light); }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-desktop   { display: none; }
          .nav-hamburger { display: flex; }
          .hero-grid     { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .crew-grid     { grid-template-columns: 1fr !important; }
          .found-row     { grid-template-columns: 1fr !important; gap: 0.75rem !important; }
          .waitlist-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .chat-desktop  { display: none !important; }
          .chat-mobile   { display: block !important; }
          .step-row      { grid-template-columns: 2.5rem 1fr; gap: 1rem; padding: 1.5rem 0; }
          .step-num      { font-size: 1.1rem; }
          .marquee-strip { font-size: 0.62rem !important; letter-spacing: 0.12em !important; gap: 1rem !important; }
        }
        @media (max-width: 480px) {
          .inline-form { flex-direction: column !important; }
          .inline-form input { border-right: 1px solid var(--border-light) !important; }
          .inline-form button { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav id="main-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(244,249,249,0.94)', backdropFilter: 'blur(14px)',
        borderBottom: '1px solid transparent',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <Image src="/logo.png" alt="Keelbase" width={160} height={40}
              style={{ objectFit: 'contain', height: '32px', width: 'auto' }} priority />
          </a>

          {/* Desktop nav */}
          <div className="nav-desktop">
            <div style={{ display: 'flex', gap: '2rem' }}>
              <a href="#vessel"       className="nav-link">The Vessel</a>
              <a href="#how-it-works" className="nav-link">How it Works</a>
              <a href="/blog"         className="nav-link">Journal</a>
              <a href="#waitlist"     className="nav-link">Early Access</a>
            </div>
            <a href="#waitlist" className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.75rem' }}>
              Request Access
            </a>
          </div>

          {/* Hamburger */}
          <div className="nav-hamburger">
            <Hamburger open={menuOpen} onClick={() => setMenuOpen(o => !o)} />
          </div>
        </div>

        {/* Mobile dropdown */}
        <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
          <a href="#vessel"       onClick={() => setMenuOpen(false)}>The Vessel</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it Works</a>
          <a href="/blog"         onClick={() => setMenuOpen(false)}>Journal</a>
          <a href="#waitlist"     onClick={() => setMenuOpen(false)}>Request Access</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: 'var(--light)', paddingTop: '64px' }}>
        <div className="container" style={{ paddingTop: 'clamp(4rem, 9vw, 8rem)', paddingBottom: 'clamp(4rem, 9vw, 8rem)' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: '5rem', alignItems: 'center' }}>

            {/* Left */}
            <div>
              <span className="label label-light fade-up">Private beta · Now open</span>
              <h1 className="fade-up" style={{ color: 'var(--dark)', marginBottom: '1.75rem', animationDelay: '0.1s' }}>
                &ldquo;Tell me about<br /><em>your business idea.&rdquo;</em>
              </h1>
              <p className="fade-up" style={{ fontSize: '1.05rem', color: 'var(--text-mid)', maxWidth: '520px', marginBottom: '1rem', fontFamily: 'var(--font-body)', animationDelay: '0.2s' }}>
                That&apos;s how it starts. Describe what you&apos;re building — the idea, the audience,
                what you want it to do. The Architect takes it from there: configures your crew,
                sets up your governance and payments, and hands you a running business.
              </p>
              <p className="fade-up" style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '2.5rem', fontFamily: 'var(--font-display)', letterSpacing: '0.04em', animationDelay: '0.28s' }}>
                One conversation. No code.
              </p>
              <div className="fade-up" style={{ animationDelay: '0.38s' }}>
                <InlineWaitlist />
              </div>
            </div>

            {/* Desktop chat */}
            <div className="chat-desktop fade-in" style={{ display: 'flex', justifyContent: 'flex-end', animationDelay: '0.5s' }}>
              <ArchitectPreview mobile={false} />
            </div>
          </div>

          {/* Mobile chat — shown below hero text */}
          <div className="chat-mobile" style={{ display: 'none', marginTop: '2.5rem' }}>
            <ArchitectPreview mobile={true} />
          </div>
        </div>

        {/* Marquee strip */}
        <div style={{ borderTop: '1px solid var(--border-light)' }}>
          <div className="container">
            <p className="marquee-strip" style={{
              fontFamily: 'var(--font-display)', fontWeight: 300,
              fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'var(--text-muted)', padding: '1.1rem 0',
              display: 'flex', gap: '2rem', flexWrap: 'nowrap', whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
              <span>Keelbase</span><span>·</span>
              <span>Bespoke Vessels</span><span>·</span>
              <span>Early Access</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── The Moment ── */}
      <section className="section-dark">
        <div className="container">
          <span className="label label-dark reveal">The Moment</span>
          <h2 className="reveal reveal-d1" style={{ color: 'var(--text-light)', maxWidth: '760px', marginBottom: '3rem' }}>
            The output of a full team.<br /><em>One founder. The crew doing the work.</em>
          </h2>
          <div style={{ maxWidth: '640px', borderTop: '1px solid var(--border-dark)', paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              'It\'s already happening. Founders running real AI-native businesses with output that would have taken a full team months to build — research, outreach, operations, client delivery — delivered by one person.',
              'The ceiling isn\'t the technology. The ceiling is everything underneath it: governance, payments, an audit trail, a way to coordinate a crew that doesn\'t break the moment something unexpected happens.',
              'Building all of that correctly takes months and an engineering team most founders don\'t have.',
            ].map((text, i) => (
              <p key={i} className="reveal" style={{ color: 'var(--text-light-mid)', fontSize: '1.05rem', lineHeight: 1.8, transitionDelay: `${0.1 + i * 0.12}s` }}>
                {text}
              </p>
            ))}
            <p className="reveal" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent-dim)', paddingTop: '0.5rem', transitionDelay: '0.46s' }}>
              That&apos;s the gap. That&apos;s what Keelbase closes.
            </p>
          </div>
        </div>
      </section>

      {/* ── The Vessel ── */}
      <section id="vessel" className="section-light">
        <div className="container">
          <span className="label label-light reveal">The Vessel</span>
          <h2 className="reveal reveal-d1" style={{ color: 'var(--dark)', maxWidth: '560px', marginBottom: '1.25rem' }}>
            A Vessel is your company.<br /><em>Built to run itself.</em>
          </h2>
          <p className="reveal reveal-d2" style={{ color: 'var(--text-mid)', maxWidth: '580px', marginBottom: '4rem', fontSize: '1.05rem' }}>
            Every deployment is a Vessel — a self-operating business with its own crew,
            its own governed treasury, and its own record of every decision the crew makes.
            You set the direction. You define the boundaries. The crew executes.
          </p>
          <div className="crew-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { num: 'I',   title: 'The Architect', delay: '0.05s', body: 'Your first conversation. It asks the right questions about your business, designs your crew, configures your governance and payments, and deploys your Vessel. One session. Nothing technical required on your end.' },
              { num: 'II',  title: 'Mira',          delay: '0.18s', body: 'Your permanent Liaison. Available in your dashboard and on Telegram. Mira knows your Vessel\'s history, surfaces what needs your attention, and takes instructions. Talking to your Vessel means talking to Mira.' },
              { num: 'III', title: 'The Crew',      delay: '0.32s', body: 'Specialists configured to your business — research, outreach, operations, client workflows. The crew runs your operation within the boundaries you set. Anything outside those boundaries comes to you first.' },
            ].map((card) => (
              <div key={card.num} className="crew-card reveal" style={{ background: 'var(--light)', border: '1px solid var(--border-light)', padding: '2rem 1.75rem', transitionDelay: card.delay }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.6rem' }}>{card.num}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1rem', letterSpacing: '0.02em', color: 'var(--dark)', marginBottom: '0.9rem' }}>{card.title}</h3>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-mid)', lineHeight: 1.75 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section id="how-it-works" className="section-dark">
        <div className="container">
          <span className="label label-dark reveal">The Process</span>
          <h2 className="reveal reveal-d1" style={{ color: 'var(--text-light)', maxWidth: '560px', marginBottom: '4rem' }}>
            From conversation<br /><em>to running operation.</em>
          </h2>
          <div>
            {[
              { n: '01', title: 'Describe Your Business',          delay: '0s',   body: 'Tell the Architect what you\'re building — what it does, who it serves, what you need it to do in the first 90 days. No form. No config screen. A conversation.' },
              { n: '02', title: 'The Architect Designs Your Crew', delay: '0.1s', body: 'It maps your business to a specialist crew configuration — asks about your workflows, your governance, your spend boundaries. At each step it tells you what it\'s building and why. At the end, you confirm.' },
              { n: '03', title: 'Your Vessel Deploys',             delay: '0.2s', body: 'Crew is live. Your boundaries are set. Takes minutes. The Architect hands you to Mira.' },
              { n: '04', title: 'Mira Takes Over',                 delay: '0.3s', body: 'From this moment, Mira is your interface to everything. The crew runs. You direct. When a decision needs you, it appears in your 2do queue.' },
            ].map((step) => (
              <div key={step.n} className="step-row reveal" style={{ transitionDelay: step.delay }}>
                <span className="step-num">{step.n}</span>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '0.9rem', letterSpacing: '0.04em', color: 'var(--text-light)', marginBottom: '0.5rem' }}>{step.title}</p>
                  <p style={{ color: 'var(--text-light-mid)', fontSize: '0.95rem', lineHeight: 1.75 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The Foundation ── */}
      <section className="section-light">
        <div className="container">
          <span className="label label-light reveal">The Foundation</span>
          <h2 className="reveal reveal-d1" style={{ color: 'var(--dark)', maxWidth: '600px', marginBottom: '1rem' }}>
            Production infrastructure.<br /><em>Not another wrapper.</em>
          </h2>
          <p className="reveal reveal-d2" style={{ color: 'var(--text-muted)', marginBottom: '4rem', fontFamily: 'var(--font-display)', fontSize: '0.88rem', letterSpacing: '0.02em' }}>
            For the founder who has been here before.
          </p>
          <div>
            {[
              { heading: 'Every decision\nis on record.',                  body: 'Your Vessel logs every consequential action your crew takes — automatically, permanently, in plain language. Not for show. Because a business that can\'t account for itself can\'t scale, and you\'ll want that record the moment something unexpected happens.' },
              { heading: 'You set the rules.\nThe crew works inside them.', body: 'During setup, you tell the Architect how much your crew can spend without asking — on tools, services, whatever the operation needs. Above that limit, nothing moves without your explicit approval.' },
              { heading: 'Your work stays\nyour work.',                     body: 'Your business context — your instructions, your customer data, your decisions — is hardware-isolated every time your crew runs. It doesn\'t get stored where someone else can read it. It doesn\'t get used to train anything. That\'s how the system is built, not a policy you have to trust.' },
            ].map((row, i) => (
              <div key={i} className="found-row" style={{ transitionDelay: `${i * 0.1}s` }}>
                <p className="found-heading" style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--dark)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{row.heading}</p>
                <p className="found-body" style={{ color: 'var(--text-mid)', fontSize: '0.97rem', lineHeight: 1.8 }}>{row.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Waitlist ── */}
      <section id="waitlist" className="section-dark">
        <div className="container">
          <div className="waitlist-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'start' }}>
            <div>
              <span className="label label-dark reveal">Early Access</span>
              <h2 className="reveal reveal-d1" style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
                Ready to build<br /><em>your Vessel?</em>
              </h2>
              <p className="reveal reveal-d2" style={{ color: 'var(--text-light-mid)', fontSize: '1.05rem', lineHeight: 1.8, maxWidth: '420px' }}>
                Early access is open for bespoke deployments. We&apos;re onboarding a first cohort —
                small enough that the Architect can give each session the attention it deserves.
                Leave your email. Tell us what you&apos;re thinking about building. We&apos;ll be in touch.
              </p>
            </div>
            <div className="reveal reveal-d2" style={{ paddingTop: '0.5rem' }}>
              <WaitlistForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--dark)', borderTop: '1px solid var(--border-dark)', padding: '2rem 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
              }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-light-mid)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-light-dim)')}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </>
  )
}