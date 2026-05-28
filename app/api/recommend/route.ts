import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('bookId')
  if (!bookId) return Response.json({ results: [] })

  const supabase = await createClient()

  const { data: book } = await supabase
    .from('books')
    .select('embedding')
    .eq('id', bookId)
    .single()

  if (!book?.embedding) return Response.json({ results: [] })

  const { data } = await supabase.rpc('match_books', {
    query_embedding: book.embedding,
    match_threshold: 0.70,
    match_count: 6,
  })

  const results = (data ?? []).filter((r: { id: string }) => r.id !== bookId).slice(0, 5)
  return Response.json({ results })
}
