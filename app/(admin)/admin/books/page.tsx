import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil } from 'lucide-react'
import { DeleteBookButton } from '@/components/books/DeleteBookButton'
import { AdminBooksToolbar } from '@/components/books/AdminBooksToolbar'

export default async function AdminBooksPage() {
  const supabase = await createClient()
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Books</h1>
          <p className="text-sm text-muted-foreground">Manage library catalog</p>
        </div>
        <div className="relative flex items-center gap-2">
          <AdminBooksToolbar />
          <Button asChild>
            <Link href="/admin/books/new">
              <Plus className="size-4" />
              Add Book
            </Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Copies</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(books ?? []).map((book) => (
              <TableRow key={book.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    {book.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.cover_url}
                        alt=""
                        className="size-10 rounded object-cover border"
                      />
                    ) : (
                      <div className="size-10 rounded bg-muted" />
                    )}
                    <div>
                      <span>{book.title}</span>
                      {book.slug && (
                        <p className="text-xs text-muted-foreground font-normal">{book.slug}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell>
                  {book.category ? (
                    <Badge variant="secondary">{book.category}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {book.available_copies}/{book.total_copies}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link href={`/admin/books/${book.id}`}>
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <DeleteBookButton bookId={book.id} bookTitle={book.title} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!books || books.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No books yet. Add your first book.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
