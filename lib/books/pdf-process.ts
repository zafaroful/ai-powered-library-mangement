import { createAdminClient } from '@/lib/supabase/admin'
import { getEmbedding } from '@/lib/openai/embeddings'
import { downloadPdf } from './storage'

const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 100

export function chunkText(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return []

  const chunks: string[] = []
  let start = 0

  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length)
    chunks.push(normalized.slice(start, end))
    if (end >= normalized.length) break
    start = end - CHUNK_OVERLAP
  }

  return chunks
}

/** Parse PDF from buffer — uses lib directly to avoid pdf-parse index.js debug test file. */
export async function extractPdfTextFromBuffer(buffer: Buffer): Promise<string> {
  const { createRequire } = await import('module')
  const require = createRequire(import.meta.url)
  // pdf-parse/index.js runs test code on load; use the parser lib only
  const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
    b: Buffer
  ) => Promise<{ text: string }>
  const result = await pdfParse(buffer)
  return result.text ?? ''
}

export async function extractPdfText(pdfPath: string): Promise<string> {
  const buffer = await downloadPdf(pdfPath)
  return extractPdfTextFromBuffer(buffer)
}

export async function processBookPdfFromText(
  bookId: string,
  pdfPath: string,
  text: string
): Promise<number> {
  const supabase = createAdminClient()
  const chunks = chunkText(text)

  await supabase.from('book_chunks').delete().eq('book_id', bookId)

  if (chunks.length === 0) {
    await supabase
      .from('books')
      .update({ pdf_processed_at: new Date().toISOString(), pdf_path: pdfPath })
      .eq('id', bookId)
    return 0
  }

  let embedded = 0
  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i]
    let embedding: number[] | null = null

    if (process.env.OPENAI_API_KEY) {
      try {
        embedding = await getEmbedding(content)
        await new Promise((r) => setTimeout(r, 100))
      } catch {
        embedding = null
      }
    }

    const { error } = await supabase.from('book_chunks').insert({
      book_id: bookId,
      chunk_index: i,
      content,
      embedding,
    })

    if (!error) embedded++
  }

  await supabase
    .from('books')
    .update({ pdf_processed_at: new Date().toISOString(), pdf_path: pdfPath })
    .eq('id', bookId)

  return embedded
}

export async function processBookPdf(bookId: string, pdfPath: string): Promise<number> {
  const text = await extractPdfText(pdfPath)
  return processBookPdfFromText(bookId, pdfPath, text)
}

export async function processBookPdfFromBuffer(
  bookId: string,
  pdfPath: string,
  buffer: Buffer
): Promise<number> {
  const text = await extractPdfTextFromBuffer(buffer)
  return processBookPdfFromText(bookId, pdfPath, text)
}
