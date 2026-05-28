import OpenAI from 'openai'
import { requireRole } from '@/lib/auth/server'

export async function POST(req: Request) {
  const admin = await requireRole('admin')
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'OpenAI not configured' }, { status: 503 })
  }

  const { title, description } = await req.json()
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a library cataloguer. Given a book title and description, 
        return ONLY a JSON object with these exact keys:
        - category: one of [Fiction, Non-Fiction, Science, Technology, History, 
          Mathematics, Literature, Self-Help, Biography, Reference]
        - tags: array of 3-5 lowercase topic tags
        - reading_level: one of [beginner, intermediate, advanced]`,
      },
      {
        role: 'user',
        content: `Title: ${title}\nDescription: ${description}`,
      },
    ],
  })

  const result = JSON.parse(completion.choices[0].message.content ?? '{}')
  return Response.json(result)
}
