import { NextRequest } from 'next/server'
import { getSessionUser } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { searchBooksByIsbn, searchBooksByText } from '@/lib/search/books'
import { isValidIsbn, normalizeIsbn } from '@/lib/utils/isbn'
import type { SearchResponse } from '@/types'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const isbnParam = req.nextUrl.searchParams.get('isbn')?.trim()
  const query = req.nextUrl.searchParams.get('q')?.trim()

  if (!isbnParam && !query) {
    return Response.json({ results: [] } satisfies SearchResponse)
  }

  const supabase = await createClient()

  try {
    if (isbnParam) {
      const normalized = normalizeIsbn(isbnParam)
      if (!isValidIsbn(normalized)) {
        return Response.json(
          { error: 'Invalid ISBN', results: [], matchType: 'isbn', extracted: { isbn: isbnParam } },
          { status: 400 }
        )
      }

      const { results, matchType } = await searchBooksByIsbn(supabase, isbnParam)
      return Response.json({
        results,
        matchType,
        extracted: { isbn: normalized },
      } satisfies SearchResponse)
    }

    const results = await searchBooksByText(supabase, query!)
    return Response.json({
      results,
      matchType: 'text',
    } satisfies SearchResponse)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    return Response.json({ error: message, results: [] }, { status: 500 })
  }
}
