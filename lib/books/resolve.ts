import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isUuid } from '@/lib/utils/slug'
import type { Book } from '@/types'

const BOOK_SELECT =
  'id, slug, title, author, isbn, description, cover_url, cover_path, pdf_path, pdf_processed_at, category, tags, reading_level, page_count, total_copies, available_copies, created_at'

const BOOK_SELECT_LEGACY =
  'id, title, author, isbn, description, cover_url, category, tags, reading_level, page_count, total_copies, available_copies, created_at'

function normalizeBook(row: Record<string, unknown> | null): Book | null {
  if (!row) return null
  const id = row.id as string
  return {
    ...(row as unknown as Book),
    slug: (row.slug as string | undefined) ?? id,
  }
}

async function fetchBook(
  slugOrId: string,
  useAdmin: boolean
): Promise<Book | null> {
  const supabase = useAdmin ? createAdminClient() : await createClient()

  const runQuery = async (select: string) => {
    let query = supabase.from('books').select(select)
    if (isUuid(slugOrId)) {
      query = query.eq('id', slugOrId)
    } else {
      query = query.eq('slug', slugOrId)
    }
    return query.maybeSingle()
  }

  const { data, error } = await runQuery(BOOK_SELECT)

  if (error) {
    const msg = error.message.toLowerCase()
    if (msg.includes('slug') || msg.includes('column') || error.code === '42703') {
      const legacy = await runQuery(BOOK_SELECT_LEGACY)
      if (legacy.data) return normalizeBook(legacy.data as unknown as Record<string, unknown>)
      if (legacy.error && !useAdmin) return fetchBook(slugOrId, true)
      return null
    }
    if (!useAdmin) return fetchBook(slugOrId, true)
    return null
  }

  return normalizeBook(data as unknown as Record<string, unknown> | null)
}

export async function getBookBySlugOrId(slugOrId: string): Promise<Book | null> {
  const book = await fetchBook(slugOrId, false)
  if (book) return book
  return fetchBook(slugOrId, true)
}

export async function getBookBySlugAdmin(slug: string): Promise<Book | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('books')
    .select(BOOK_SELECT)
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    const { data: legacy } = await supabase
      .from('books')
      .select(BOOK_SELECT_LEGACY)
      .eq('slug', slug)
      .maybeSingle()
    return normalizeBook(legacy as unknown as Record<string, unknown> | null)
  }

  return normalizeBook(data as unknown as Record<string, unknown> | null)
}
