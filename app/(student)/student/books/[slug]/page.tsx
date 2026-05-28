import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, FileText } from 'lucide-react'
import { getBookBySlugOrId } from '@/lib/books/resolve'
import { isUuid } from '@/lib/utils/slug'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BorrowButton } from '@/components/borrow/BorrowButton'
import { ReserveButton } from '@/components/borrow/ReserveButton'
import { RecommendationStrip } from '@/components/recommendations/RecommendationStrip'
import { BookSidebarTabs } from '@/components/books/BookSidebarTabs'

export default async function StudentBookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug: slugOrId } = await params
  const book = await getBookBySlugOrId(slugOrId)

  if (!book) notFound()

  // Redirect UUID URLs to slug when we have a real slug (not id fallback)
  if (isUuid(slugOrId) && book.slug && book.slug !== book.id) {
    redirect(`/student/books/${book.slug}`)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-col gap-6 md:flex-row lg:flex-1">
          <div className="flex aspect-[3/4] w-48 shrink-0 items-center justify-center rounded-lg bg-muted">
            {book.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.cover_url} alt={book.title} className="h-full w-full rounded-lg object-cover" />
            ) : (
              <BookOpen className="size-16 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl font-semibold">{book.title}</h1>
              <p className="text-muted-foreground">by {book.author}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {book.category && <Badge>{book.category}</Badge>}
              {book.reading_level && <Badge variant="secondary">{book.reading_level}</Badge>}
              {book.tags?.map((tag: string) => (
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
            {book.description && (
              <p className="text-sm leading-relaxed">{book.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {book.isbn && <span>ISBN: {book.isbn}</span>}
              {book.page_count && <span>{book.page_count} pages</span>}
              <span>
                {book.available_copies > 0
                  ? `${book.available_copies} of ${book.total_copies} available`
                  : 'Currently unavailable'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {book.available_copies > 0 ? (
                <BorrowButton bookId={book.id} available />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground w-full">
                    All copies are out. Reserve to join the queue.
                  </p>
                  <ReserveButton bookId={book.id} unavailable />
                </>
              )}
              {book.pdf_path && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/books/by-slug/${book.slug}/pdf`} target="_blank" rel="noopener noreferrer">
                    <FileText className="size-4" />
                    View PDF
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:w-[380px] lg:shrink-0">
          <BookSidebarTabs
            bookSlug={book.slug ?? book.id}
            bookTitle={book.title}
            pdfProcessed={!!book.pdf_processed_at}
            description={book.description}
          />
        </div>
      </div>

      <RecommendationStrip bookId={book.id} />
    </div>
  )
}
