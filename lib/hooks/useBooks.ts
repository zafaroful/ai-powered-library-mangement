'use client'

import { useEffect, useState } from 'react'
import type { Book } from '@/types'

export function useBooks(query?: string) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBooks() {
      setLoading(true)
      setError(null)
      try {
        const params = query ? `?q=${encodeURIComponent(query)}` : ''
        const res = await fetch(`/api/books${params}`)
        if (!res.ok) throw new Error('Failed to fetch books')
        const data = await res.json()
        setBooks(data.books ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBooks()
  }, [query])

  return { books, loading, error }
}
