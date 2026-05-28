import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/server'
import { uploadCover } from '@/lib/books/storage'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(req: NextRequest) {
  const admin = await requireRole('admin')
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const bookId = formData.get('bookId') as string | null
  const file = formData.get('file') as File | null

  if (!bookId || !file) {
    return Response.json({ error: 'bookId and file are required' }, { status: 400 })
  }

  if (!ALLOWED.includes(file.type)) {
    return Response.json({ error: 'Invalid image type. Use JPEG, PNG, or WebP.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: 'Image must be under 5MB' }, { status: 400 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const { path, publicUrl } = await uploadCover(bookId, buffer, file.type, file.name)

    const supabase = createAdminClient()
    await supabase
      .from('books')
      .update({ cover_path: path, cover_url: publicUrl })
      .eq('id', bookId)

    return Response.json({ cover_path: path, cover_url: publicUrl })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
