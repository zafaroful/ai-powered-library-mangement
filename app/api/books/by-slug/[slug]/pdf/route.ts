import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/server'
import { getBookBySlugOrId } from '@/lib/books/resolve'
import { getSignedPdfUrl } from '@/lib/books/storage'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const book = await getBookBySlugOrId(slug)

  if (!book?.pdf_path) {
    return NextResponse.json({ error: 'PDF not available' }, { status: 404 })
  }

  try {
    const signedUrl = await getSignedPdfUrl(book.pdf_path)
    return NextResponse.redirect(signedUrl)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to open PDF' },
      { status: 500 }
    )
  }
}
