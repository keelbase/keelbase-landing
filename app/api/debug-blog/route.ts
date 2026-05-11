export async function GET() {
  const id = process.env.NOTION_BLOG_DATABASE_ID
  const key = process.env.NOTION_API_KEY

  const res = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      filter: { property: 'Published', checkbox: { equals: true } }
    }),
  })

  const data = await res.json()
  return Response.json({ status: res.status, results: data.results?.length ?? 0, error: data.message ?? null })
}