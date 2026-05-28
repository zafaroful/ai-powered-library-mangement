import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth/server'
import { extractBookFromImage } from '@/lib/openai/vision'
import {
  buildSearchQueryFromExtracted,
  searchBooksByIsbn,
  searchBooksByText,
} from '@/lib/search/books'
import { createClient } from '@/lib/supabase/server'
import { isValidIsbn, normalizeIsbn } from '@/lib/utils/isbn'
import type { SearchResponse } from '@/types'

export const runtime = 'nodejs'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'OpenAI not configured' }, { status: 503 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const mode = (formData.get('mode') as string | null) ?? 'auto'

  if (!file) {
    return Response.json({ error: 'file is required' }, { status: 400 })
  }

  if (!ALLOWED.includes(file.type)) {
    return Response.json(
      { error: 'Invalid image type. Use JPEG, PNG, or WebP.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'Image must be under 5MB' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const extracted = await extractBookFromImage(base64, file.type)

    const supabase = await createClient()

    if (extracted.isbn) {
      const normalized = normalizeIsbn(extracted.isbn)
      if (isValidIsbn(normalized)) {
        const { results } = await searchBooksByIsbn(supabase, extracted.isbn)
        if (results.length > 0) {
          return Response.json({
            results,
            matchType: 'isbn',
            extracted: { ...extracted, isbn: normalized },
          } satisfies SearchResponse)
        }
      }
    }

    const searchQuery = buildSearchQueryFromExtracted(extracted)
    if (!searchQuery) {
      return Response.json(
        {
          error: 'Could not identify a book from this image. Try a clearer photo of the cover or barcode.',
          results: [],
          matchType: 'cover',
          extracted,
        },
        { status: 422 }
      )
    }

    const results = await searchBooksByText(supabase, searchQuery)

    return Response.json({
      results,
      matchType: mode === 'cover' || extracted.title || extracted.author ? 'cover' : 'text',
      extracted,
    } satisfies SearchResponse)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image search failed'
    return Response.json({ error: message, results: [] }, { status: 500 })
  }
}
