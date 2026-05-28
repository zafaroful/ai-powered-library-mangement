import { getEmbedding } from '@/lib/openai/embeddings'
import { isbnLookupVariants, normalizeIsbn } from '@/lib/utils/isbn'
import { ilikePattern } from '@/lib/utils/search'
import type { Book, SearchMatchType } from '@/types'

export const BOOK_SELECT =
  'id, slug, title, author, isbn, description, cover_url, category, tags, reading_level, page_count, total_copies, available_copies, created_at'

export type SearchRow = Book & { similarity?: number }

type SupabaseClient = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>

async function keywordSearch(supabase: SupabaseClient, query: string): Promise<SearchRow[]> {
  const pattern = ilikePattern(query)

  const [byTitle, byAuthor, byDescription] = await Promise.all([
    supabase.from('books').select(BOOK_SELECT).ilike('title', pattern).limit(10),
    supabase.from('books').select(BOOK_SELECT).ilike('author', pattern).limit(10),
    supabase.from('books').select(BOOK_SELECT).ilike('description', pattern).limit(10),
  ])

  const err = byTitle.error ?? byAuthor.error ?? byDescription.error
  if (err) throw new Error(err.message)

  const seen = new Set<string>()
  const merged: SearchRow[] = []
  for (const row of [...(byTitle.data ?? []), ...(byAuthor.data ?? []), ...(byDescription.data ?? [])]) {
    if (!seen.has(row.id)) {
      seen.add(row.id)
      merged.push({ ...row, similarity: 0 })
    }
  }
  return merged
}

export async function searchBooksByText(
  supabase: SupabaseClient,
  query: string
): Promise<SearchRow[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  let semanticResults: SearchRow[] = []

  if (process.env.OPENAI_API_KEY) {
    try {
      const embedding = await getEmbedding(trimmed)
      const { data, error } = await supabase.rpc('match_books', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 10,
      })

      if (error) {
        console.error('[search] match_books:', error.message)
      } else {
        semanticResults = (data ?? []) as SearchRow[]
      }
    } catch (err) {
      console.error('[search] embedding:', err)
    }
  }

  const keywordResults = await keywordSearch(supabase, trimmed)

  const seen = new Set(semanticResults.map((r) => r.id))
  return [
    ...semanticResults,
    ...keywordResults.filter((r) => !seen.has(r.id)),
  ]
}

export async function searchBooksByIsbn(
  supabase: SupabaseClient,
  isbn: string
): Promise<{ results: SearchRow[]; matchType: SearchMatchType }> {
  const variants = isbnLookupVariants(isbn)

  for (const variant of variants) {
    const { data, error } = await supabase
      .from('books')
      .select(BOOK_SELECT)
      .eq('isbn', variant)
      .limit(1)

    if (error) throw new Error(error.message)
    if (data?.[0]) {
      return {
        results: [{ ...data[0], similarity: 1 }],
        matchType: 'isbn',
      }
    }
  }

  const target = normalizeIsbn(isbn).toUpperCase()
  const { data: allWithIsbn, error } = await supabase
    .from('books')
    .select(BOOK_SELECT)
    .not('isbn', 'is', null)

  if (error) throw new Error(error.message)

  const match = (allWithIsbn ?? []).find((book) => {
    if (!book.isbn) return false
    return normalizeIsbn(book.isbn).toUpperCase() === target
  })

  if (match) {
    return {
      results: [{ ...match, similarity: 1 }],
      matchType: 'isbn',
    }
  }

  return { results: [], matchType: 'isbn' }
}

export function buildSearchQueryFromExtracted(extracted: {
  title?: string | null
  author?: string | null
}): string | null {
  const title = extracted.title?.trim()
  const author = extracted.author?.trim()

  if (title && author) return `${title} by ${author}`
  if (title) return title
  if (author) return author
  return null
}
