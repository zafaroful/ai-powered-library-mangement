import { createAdminClient } from '@/lib/supabase/admin'
import { getSupabaseUrl } from '@/lib/supabase/env'

export const COVER_BUCKET = 'book-covers'
export const PDF_BUCKET = 'book-pdfs'

export function getPublicCoverUrl(coverPath: string): string {
  const base = getSupabaseUrl()
  return `${base}/storage/v1/object/public/${COVER_BUCKET}/${coverPath}`
}

export async function getSignedPdfUrl(pdfPath: string, expiresIn = 3600): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(pdfPath, expiresIn)

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? 'Failed to create signed URL')
  }
  return data.signedUrl
}

export async function uploadCover(
  bookId: string,
  file: Buffer,
  contentType: string,
  filename: string
): Promise<{ path: string; publicUrl: string }> {
  const ext = filename.split('.').pop() ?? 'jpg'
  const path = `${bookId}/cover.${ext}`
  const supabase = createAdminClient()

  const { error } = await supabase.storage.from(COVER_BUCKET).upload(path, file, {
    contentType,
    upsert: true,
  })

  if (error) throw new Error(error.message)
  return { path, publicUrl: getPublicCoverUrl(path) }
}

export async function uploadPdf(
  bookId: string,
  file: Buffer,
  filename: string
): Promise<string> {
  const path = `${bookId}/${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const supabase = createAdminClient()

  const { error } = await supabase.storage.from(PDF_BUCKET).upload(path, file, {
    contentType: 'application/pdf',
    upsert: true,
  })

  if (error) throw new Error(error.message)
  return path
}

export async function downloadPdf(pdfPath: string): Promise<Buffer> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage.from(PDF_BUCKET).download(pdfPath)
  if (error || !data) throw new Error(error?.message ?? 'Failed to download PDF')
  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}
