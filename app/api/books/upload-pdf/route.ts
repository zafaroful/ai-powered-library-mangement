import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { uploadPdf } from '@/lib/books/storage'
import { processBookPdfFromBuffer } from '@/lib/books/pdf-process'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const MAX_SIZE = 50 * 1024 * 1024

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const bookId = formData.get('bookId') as string | null
  const file = formData.get('file') as File | null

  if (!bookId || !file) {
    return Response.json({ error: 'bookId and file are required' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return Response.json({ error: 'File must be a PDF' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'PDF must be under 50MB' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const pdfPath = await uploadPdf(bookId, buffer, file.name)

    const supabase = createAdminClient()
    await supabase
      .from('books')
      .update({ pdf_path: pdfPath, pdf_processed_at: null })
      .eq('id', bookId)

    const chunksEmbedded = await processBookPdfFromBuffer(bookId, pdfPath, buffer)

    return Response.json({
      pdf_path: pdfPath,
      chunks_embedded: chunksEmbedded,
      pdf_processed_at: new Date().toISOString(),
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'PDF upload failed' },
      { status: 500 }
    )
  }
}
