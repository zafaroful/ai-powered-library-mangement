import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEmbedding, bookToEmbeddingText } from '@/lib/openai/embeddings'
import { requireRole } from '@/lib/auth/server'
import { generateUniqueSlug, slugify } from '@/lib/utils/slug'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('books')
    .select('id, slug, title, author, isbn, description, cover_url, cover_path, pdf_path, pdf_processed_at, category, tags, reading_level, page_count, total_copies, available_copies, created_at')
    .eq('id', id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json({ book: data })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole('admin')
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('books')
    .select('total_copies, available_copies, title, slug')
    .eq('id', id)
    .single()

  const totalCopies = body.total_copies ?? existing?.total_copies ?? 1
  const borrowed = (existing?.total_copies ?? 1) - (existing?.available_copies ?? 1)
  const availableCopies = Math.max(0, totalCopies - borrowed)

  let slug = existing?.slug
  if (body.title && body.title !== existing?.title) {
    const base = slugify(body.title)
    if (base !== existing?.slug) {
      slug = await generateUniqueSlug(body.title, async (s) => {
        const { data } = await supabase
          .from('books')
          .select('id')
          .eq('slug', s)
          .neq('id', id)
          .maybeSingle()
        return !!data
      })
    }
  }

  const { data: book, error } = await supabase
    .from('books')
    .update({
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
      available_copies: availableCopies,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  if (book && process.env.OPENAI_API_KEY) {
    try {
      const embedding = await getEmbedding(bookToEmbeddingText(book))
      await supabase.from('books').update({ embedding }).eq('id', id)
    } catch {
      // ignore embedding errors
    }
  }

  return Response.json({ book })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole('admin')
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from('books').delete().eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
