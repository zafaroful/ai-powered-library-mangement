import { createClient } from '@/lib/supabase/server'
import { StudentBooksClient } from '@/components/books/StudentBooksClient'

export default async function StudentBooksPage() {
  const supabase = await createClient()
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('title')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Browse Books</h1>
        <p className="text-sm text-muted-foreground">
          Search by keyword, natural language, or upload a cover/barcode photo
        </p>
      </div>
      <StudentBooksClient initialBooks={books ?? []} />
    </div>
  )
}
