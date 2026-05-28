'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/lib/hooks/useDebounce'
import type { Book, SearchResult } from '@/types'

interface SmartSearchProps {
  onResults: (results: (Book | SearchResult)[], query: string) => void
  onSearchStart?: () => void
  onSearchEnd?: () => void
  onClear?: () => void
  placeholder?: string
}

export function SmartSearch({
  onResults,
  onSearchStart,
  onSearchEnd,
  onClear,
  placeholder,
}: SmartSearchProps) {
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const debouncedQuery = useDebounce(query, 500)

  const onResultsRef = useRef(onResults)
  const onSearchStartRef = useRef(onSearchStart)
  const onSearchEndRef = useRef(onSearchEnd)
  const onClearRef = useRef(onClear)

  onResultsRef.current = onResults
  onSearchStartRef.current = onSearchStart
  onSearchEndRef.current = onSearchEnd
  onClearRef.current = onClear

  useEffect(() => {
    const trimmed = debouncedQuery.trim()

    if (!trimmed) {
      setError(null)
      onClearRef.current?.()
      onResultsRef.current([], '')
      onSearchEndRef.current?.()
      return
    }

    const controller = new AbortController()

    async function runSearch() {
      setError(null)
      onSearchStartRef.current?.()

      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        )
        const data = await res.json()

        if (!res.ok) {
          setError(data.error ?? 'Search failed')
          onResultsRef.current([], trimmed)
          return
        }

        onResultsRef.current(data.results ?? [], trimmed)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError('Search failed. Please try again.')
        onResultsRef.current([], trimmed)
      } finally {
        onSearchEndRef.current?.()
      }
    }

    runSearch()
    return () => controller.abort()
  }, [debouncedQuery])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder={placeholder ?? 'Search books...'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
