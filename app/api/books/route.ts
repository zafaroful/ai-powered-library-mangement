import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmbedding, bookToEmbeddingText } from '@/lib/openai/embeddings'
import { requireRole } from '@/lib/auth/server'
import { ilikePattern } from '@/lib/utils/search'
import { generateUniqueSlug } from '@/lib/utils/slug'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const q = req.nextUrl.searchParams.get('q')?.trim()

  if (!q) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ books: data })
  }

  const pattern = ilikePattern(q)
  const [byTitle, byAuthor] = await Promise.all([
    supabase.from('books').select('*').ilike('title', pattern).limit(50),
    supabase.from('books').select('*').ilike('author', pattern).limit(50),
  ])

  const error = byTitle.error ?? byAuthor.error
  if (error) return Response.json({ error: error.message }, { status: 500 })

  const seen = new Set<string>()
  const books = [...(byTitle.data ?? []), ...(byAuthor.data ?? [])].filter((b) => {
    if (seen.has(b.id)) return false
    seen.add(b.id)
    return true
  })

  return Response.json({ books })
}

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const supabase = createAdminClient()

  const totalCopies = body.total_copies ?? 1

  const slug = await generateUniqueSlug(body.title, async (s) => {
    const { data } = await supabase.from('books').select('id').eq('slug', s).maybeSingle()
    return !!data
  })

  const { data: book, error } = await supabase
    .from('books')
    .insert({
      slug,
      title: body.title,
      author: body.author,
      isbn: body.isbn,
      description: body.description,
      cover_url: body.cover_url,
      cover_path: body.cover_path,
      pdf_path: body.pdf_path,
      category: body.category,
      tags: body.tags,
      reading_level: body.reading_level,
      page_count: body.page_count,
      total_copies: totalCopies,
      available_copies: totalCopies,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (book && process.env.OPENAI_API_KEY) {
    try {
      const embedding = await getEmbedding(bookToEmbeddingText(book))
      await supabase.from('books').update({ embedding }).eq('id', book.id)
    } catch {
      // Embedding failure should not block book creation
    }
  }

  return Response.json({ book }, { status: 201 })
}
