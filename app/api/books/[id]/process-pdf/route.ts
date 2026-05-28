import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { processBookPdf } from '@/lib/books/pdf-process'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireRole('admin')
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createAdminClient()

  const { data: book } = await supabase
    .from('books')
    .select('pdf_path')
    .eq('id', id)
    .single()

  if (!book?.pdf_path) {
    return Response.json({ error: 'No PDF uploaded for this book' }, { status: 400 })
  }

  try {
    const chunksEmbedded = await processBookPdf(id, book.pdf_path)
    return Response.json({ chunks_embedded: chunksEmbedded })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
