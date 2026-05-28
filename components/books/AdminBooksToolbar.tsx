'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import { ImageSearch } from '@/components/search/ImageSearch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Pencil, ScanLine } from 'lucide-react'
import type { Book, ImageSearchMeta } from '@/types'

export function AdminBooksToolbar() {
  const [open, setOpen] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [results, setResults] = useState<Book[]>([])
  const [meta, setMeta] = useState<ImageSearchMeta>({})
  const [searching, setSearching] = useState(false)

  const handleResults = useCallback((books: Book[], searchMeta: ImageSearchMeta) => {
    setResults(books)
    setMeta(searchMeta)
    if (books.length > 0 || searchMeta.extracted) {
      setOpen(true)
    }
  }, [])

  const handleClear = useCallback(() => {
    setResults([])
    setMeta({})
    setOpen(false)
  }, [])

  return (
    <>
      <Button variant="outline" onClick={() => setScanOpen((v) => !v)}>
        <ScanLine className="size-4" />
        Find by image
      </Button>

      {scanOpen && (
        <div className="absolute right-0 top-full z-10 mt-2 w-full min-w-[320px] max-w-md rounded-lg border bg-background p-4 shadow-lg sm:w-96">
          <ImageSearch
            onResults={handleResults}
            onSearchStart={() => setSearching(true)}
            onSearchEnd={() => setSearching(false)}
            onClear={handleClear}
          />
          {searching && (
            <p className="mt-2 text-xs text-muted-foreground">Searching catalog...</p>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {results.length === 1 ? 'Book found' : results.length > 1 ? 'Matching books' : 'No match'}
            </DialogTitle>
            <DialogDescription>
              {meta.matchType === 'isbn'
                ? 'Matched by ISBN barcode.'
                : meta.matchType === 'cover'
                  ? 'Matched from cover photo.'
                  : 'Search results from image analysis.'}
            </DialogDescription>
          </DialogHeader>

          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This book is not in the catalog
              {meta.extracted?.isbn ? ` (ISBN ${meta.extracted.isbn})` : ''}.
            </p>
          ) : (
            <ul className="space-y-3">
              {results.map((book) => (
                <li
                  key={book.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  {book.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_url}
                      alt=""
                      className="size-14 rounded object-cover border"
                    />
                  ) : (
                    <div className="size-14 rounded bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{book.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                    {book.isbn && (
                      <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>
                    )}
                    {book.category && (
                      <Badge variant="secondary" className="mt-1">
                        {book.category}
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/books/${book.id}`} onClick={() => setOpen(false)}>
                      <Pencil className="size-4" />
                      Edit
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
