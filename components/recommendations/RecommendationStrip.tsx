'use client'

import { useEffect, useState } from 'react'
import { BookGrid } from '@/components/books/BookGrid'
import type { Book } from '@/types'

export function RecommendationStrip({ bookId }: { bookId: string }) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRecommendations() {
      const res = await fetch(`/api/recommend?bookId=${bookId}`)
      if (res.ok) {
        const data = await res.json()
        setBooks(data.results ?? [])
      }
      setLoading(false)
    }
    fetchRecommendations()
  }, [bookId])

  if (loading) return null
  if (books.length === 0) return null

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">You might also like</h2>
      <BookGrid
        books={books}
        getHref={(book) => `/student/books/${book.slug ?? book.id}`}
        showAvailability={false}
      />
    </section>
  )
}
