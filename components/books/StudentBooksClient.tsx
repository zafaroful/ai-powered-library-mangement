'use client'

import { useCallback, useState } from 'react'
import { BookGrid } from './BookGrid'
import { ReserveButton } from '@/components/borrow/ReserveButton'
import { ImageSearch } from '@/components/search/ImageSearch'
import { SmartSearch } from '@/components/search/SmartSearch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Book, ImageSearchMeta, SearchResult } from '@/types'

export function StudentBooksClient({ initialBooks }: { initialBooks: Book[] }) {
  const [books, setBooks] = useState<Book[]>(initialBooks)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'text' | 'image'>('text')
  const [imageMeta, setImageMeta] = useState<ImageSearchMeta>({})

  const handleSearchResults = useCallback(
    (results: (Book | SearchResult)[], query: string) => {
      setSearchQuery(query)
      setImageMeta({})
      if (!query.trim()) {
        setBooks(initialBooks)
      } else {
        setBooks(results as Book[])
      }
    },
    [initialBooks]
  )

  const handleImageResults = useCallback(
    (results: Book[], meta: ImageSearchMeta) => {
      setImageMeta(meta)
      setSearchQuery(
        meta.query ??
          meta.extracted?.title ??
          meta.extracted?.isbn ??
          (results.length > 0 ? 'image search' : '')
      )
      if (results.length === 0 && !meta.extracted) {
        setBooks(initialBooks)
      } else {
        setBooks(results)
      }
    },
    [initialBooks]
  )

  const handleClear = useCallback(() => {
    setSearchQuery('')
    setImageMeta({})
    setBooks(initialBooks)
  }, [initialBooks])

  const hasActiveSearch = searchQuery.trim().length > 0 || Object.keys(imageMeta).length > 0

  return (
    <div className="space-y-6">
      <Tabs
        value={searchMode}
        onValueChange={(value) => {
          setSearchMode(value as 'text' | 'image')
          handleClear()
        }}
      >
        <TabsList>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-4">
          <SmartSearch
            onResults={handleSearchResults}
            onSearchStart={() => setSearching(true)}
            onSearchEnd={() => setSearching(false)}
            onClear={handleClear}
            placeholder="Try: machine learning for beginners..."
          />
        </TabsContent>

        <TabsContent value="image" className="mt-4">
          <ImageSearch
            onResults={handleImageResults}
            onSearchStart={() => setSearching(true)}
            onSearchEnd={() => setSearching(false)}
            onClear={handleClear}
          />
        </TabsContent>
      </Tabs>

      {searching ? (
        <p className="text-center text-sm text-muted-foreground py-8">Searching...</p>
      ) : books.length === 0 && hasActiveSearch ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          No books found
          {searchMode === 'text' && searchQuery.trim() ? ` for "${searchQuery}"` : ''}
          {searchMode === 'image' && imageMeta.extracted?.isbn
            ? ` for ISBN ${imageMeta.extracted.isbn}`
            : searchMode === 'image' && imageMeta.extracted?.title
              ? ` for "${imageMeta.extracted.title}"`
              : ''}
          .
        </p>
      ) : (
        <BookGrid
          books={books}
          getHref={(book) => `/student/books/${book.slug ?? book.id}`}
          renderActions={(book) =>
            book.available_copies < 1 ? (
              <ReserveButton bookId={book.id} unavailable />
            ) : null
          }
        />
      )}
    </div>
  )
}
