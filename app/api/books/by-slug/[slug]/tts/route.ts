import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth/server'
import { getBookBySlugOrId } from '@/lib/books/resolve'
import { generateSpeech } from '@/lib/openai/tts'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'AI not configured' }, { status: 503 })
  }

  const { slug } = await params
  const book = await getBookBySlugOrId(slug)

  if (!book) {
    return Response.json({ error: 'Book not found' }, { status: 404 })
  }

  const description = book.description?.trim()
  if (!description) {
    return Response.json({ error: 'No description available for recitation' }, { status: 404 })
  }

  try {
    const audio = await generateSpeech(description)
    return new Response(audio, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate speech'
    return Response.json({ error: message }, { status: 500 })
  }
}
