import { BookCard } from './BookCard'
import type { Book } from '@/types'

interface BookGridProps {
  books: Book[]
  getHref?: (book: Book) => string
  showAvailability?: boolean
  renderActions?: (book: Book) => React.ReactNode
}

export function BookGrid({ books, getHref, showAvailability, renderActions }: BookGridProps) {
  if (books.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">No books found.</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          href={getHref?.(book)}
          showAvailability={showAvailability}
          actions={renderActions?.(book)}
        />
      ))}
    </div>
  )
}
