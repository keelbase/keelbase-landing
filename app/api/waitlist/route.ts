import { NextRequest, NextResponse } from 'next/server'

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID!
const NOTION_API_KEY     = process.env.NOTION_API_KEY!
const RESEND_API_KEY     = process.env.RESEND_API_KEY!
const TEAM_EMAIL         = process.env.TEAM_EMAIL  ?? 'ahoy@keelbase.io'
const FROM_EMAIL         = process.env.FROM_EMAIL  ?? 'Keelbase <ahoy@keelbase.io>'

async function writeToNotion(email: string, idea: string): Promise<string> {
  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        // Title field (Lead) — required by Notion, use email as the row title
        Lead: {
          title: [{ text: { content: email } }]
        },
        // Email field
        Email: { email },
        // Idea field
        Idea: {
          rich_text: [{ text: { content: idea || '' } }]
        },
        // Submitted At — Notion date format
        'Submitted At': {
          date: { start: new Date().toISOString() }
        },
        // Status
        Status: { status: { name: 'On waitlist' } },
      },
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    console.error('[Notion] API error:', JSON.stringify(data))
    throw new Error(data.message ?? 'Notion write failed')
  }
  return `https://notion.so/${(data.id ?? '').replace(/-/g, '')}`
}

async function sendEmail(to: string, subject: string, text: string, html: string, headers?: Record<string, string>) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, text, html, headers }),
  })
  if (!res.ok) {
    const data = await res.json()
    console.error('[Resend] API error:', JSON.stringify(data))
  }
}

export async function POST(req: NextRequest) {
  let email = '', idea = ''
  try {
    const body = await req.json()
    email = (body.email ?? '').trim().toLowerCase()
    idea  = (body.idea  ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const when = new Date().toISOString()

  // 1. Write to Notion
  let notionUrl = ''
  try {
    notionUrl = await writeToNotion(email, idea)
  } catch (err) {
    console.error('[Notion] write failed:', err)
    // Don't block the response — still send emails
  }

  // 2. Confirmation to submitter
  try {
    await sendEmail(
      email,
      "You made it to Keelbase.",
      `You made it.\n\nWe're building something we genuinely believe changes what it means to run a business — and the fact that you're here, thinking about it, means a lot.\n\nThe first cohort is small by design. When your spot opens, the Architect will reach out directly. Until then — keep thinking about what you want to build. The clearer the idea, the better the conversation.\n\nTalk soon.\n\n— Vandal\nFounder, Keelbase\nkeelbase.io`,
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="background:#f4f9f9;color:#0d3534;font-family:Georgia,serif;font-size:16px;line-height:1.7;padding:48px 32px;max-width:520px;margin:0 auto;"><p style="font-style:italic;font-size:1.5rem;color:#0d3534;font-family:Georgia,serif;margin:0 0 2rem;">You made it.</p><p style="color:#2a4a49;font-family:'Trebuchet MS',system-ui,sans-serif;font-size:15px;margin:0 0 1.25rem;">We&rsquo;re building something we genuinely believe changes what it means to run a business &mdash; and the fact that you&rsquo;re here, thinking about it, means a lot.</p><p style="color:#2a4a49;font-family:'Trebuchet MS',system-ui,sans-serif;font-size:15px;margin:0 0 2rem;">The first cohort is small by design. When your spot opens, the Architect will reach out directly. Until then &mdash; keep thinking about what you want to build. The clearer the idea, the better the conversation.</p><p style="color:#2a4a49;font-family:'Trebuchet MS',system-ui,sans-serif;font-size:15px;margin:0 0 2rem;">Talk soon.</p><p style="color:#5a7a79;font-size:0.85rem;font-family:'Trebuchet MS',system-ui,sans-serif;border-top:1px solid #d0e4e4;padding-top:1.5rem;margin:0;">&mdash; Vandal<br>Founder, Keelbase &nbsp;&middot;&nbsp;<a href="https://keelbase.io" style="color:#3d7a72;text-decoration:none;">keelbase.io</a></p></body></html>`,
      {
        'List-Unsubscribe': '<mailto:ahoy@keelbase.io?subject=unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      }
    )
  } catch (err) {
    console.error('[Resend] confirmation failed:', err)
  }

  // 3. Team notification
  try {
    await sendEmail(
      TEAM_EMAIL,
      `New waitlist signup — ${email}`,
      [`New founder on the waitlist.`, ``, `Email:  ${email}`, `Idea:   ${idea || '(not provided)'}`, `When:   ${when}`, notionUrl ? `Notion: ${notionUrl}` : ''].filter(Boolean).join('\n'),
      `<p style="font-family:system-ui,sans-serif;"><strong>${email}</strong> joined the waitlist.</p><p style="font-family:system-ui,sans-serif;">Idea: ${idea || '(not provided)'}</p><p style="font-family:system-ui,sans-serif;">When: ${when}</p>${notionUrl ? `<p style="font-family:system-ui,sans-serif;"><a href="${notionUrl}">View in Notion →</a></p>` : ''}`
    )
  } catch (err) {
    console.error('[Resend] team notification failed:', err)
  }

  return NextResponse.json({ ok: true })
}