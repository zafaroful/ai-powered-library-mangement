import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BookForm } from '@/components/books/BookForm'

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', id)
    .single()

  if (!book) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit Book</h1>
      <BookForm book={book} mode="edit" />
    </div>
  )
}
