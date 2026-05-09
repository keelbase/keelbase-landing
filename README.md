# Keelbase — Landing Page

Public landing page and waitlist for [keelbase.io](https://keelbase.io).

Built with Next.js 14, Tailwind CSS, Resend, and Notion.

---

## What this is

The Keelbase waitlist landing page. Collects founder signups, writes them to a Notion database, and sends a confirmation email via Resend.

---

## Stack

- **Framework** — Next.js 14 (App Router)
- **Styling** — Tailwind CSS + CSS variables
- **Form handler** — `/app/api/waitlist/route.ts`
- **Email** — Resend
- **Database** — Notion API

---

## Environment variables

Create a `.env.local` file in the project root (never committed):

```
NOTION_API_KEY=secret_xxxx
NOTION_DATABASE_ID=xxxx
RESEND_API_KEY=re_xxxx
TEAM_EMAIL=ahoy@keelbase.io
FROM_EMAIL=Keelbase <ahoy@keelbase.io>
```

For production, add these in Vercel under Project → Settings → Environment Variables.

---

## Notion database structure

The waitlist database expects these properties:

| Property | Type |
|---|---|
| Lead | Title |
| Email | Email |
| Idea | Text |
| Submitted At | Date |
| Status | Select (default: On waitlist) |

---

## Local development

```bash
npm install
npm run build
npm run start
```

The dev server (`npm run dev`) runs but may be slow in WSL environments. Use build + start for local preview.

---

## Deployment

Deployed automatically via Vercel on push to `main`.

---

*Every company needs a keel.*