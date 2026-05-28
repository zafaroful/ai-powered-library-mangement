import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Book } from '@/types'

interface BookCardProps {
  book: Book
  href?: string
  showAvailability?: boolean
  actions?: React.ReactNode
}

export function BookCard({ book, href, showAvailability = true, actions }: BookCardProps) {
  const main = (
    <>
      <div className="flex aspect-[3/4] items-center justify-center bg-muted">
        {book.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.cover_url} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <BookOpen className="size-12 text-muted-foreground/40" />
        )}
      </div>
      <CardHeader className="pb-2">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        {book.category && (
          <Badge variant="secondary" className="text-xs">
            {book.category}
          </Badge>
        )}
      </CardContent>
    </>
  )

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      {href ? (
        <Link href={href} className="block flex-1">
          {main}
        </Link>
      ) : (
        <div className="flex-1">{main}</div>
      )}
      {showAvailability && (
        <CardFooter className="flex flex-col items-stretch gap-2 pt-0">
          <span className="text-xs text-muted-foreground">
            {book.available_copies > 0
              ? `${book.available_copies} available`
              : 'Unavailable — reserve to queue'}
          </span>
          {actions && (
            <div
              className="flex flex-col gap-1"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          )}
        </CardFooter>
      )}
      {!showAvailability && actions && (
        <CardFooter className="pt-0" onClick={(e) => e.stopPropagation()}>
          {actions}
        </CardFooter>
      )}
    </Card>
  )
}
