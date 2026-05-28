import { createAdminClient } from '@/lib/supabase/admin'
import { getEmbedding, bookToEmbeddingText } from '@/lib/openai/embeddings'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: books } = await supabase
    .from('books')
    .select('id, title, description')
    .is('embedding', null)

  let embedded = 0
  for (const book of books ?? []) {
    const embedding = await getEmbedding(bookToEmbeddingText(book))
    await supabase.from('books').update({ embedding }).eq('id', book.id)
    await new Promise((r) => setTimeout(r, 200))
    embedded++
  }

  return Response.json({ embedded })
}
