import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { SearchResult } from '@/types'

function SimilarityBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const variant = pct >= 90 ? 'default' : pct >= 75 ? 'secondary' : 'outline'
  return <Badge variant={variant}>{pct}% match</Badge>
}

interface SearchResultsProps {
  results: SearchResult[]
  hrefPrefix?: string
}

export function SearchResults({ results, hrefPrefix = '/student/books' }: SearchResultsProps) {
  if (results.length === 0) {
    return <p className="text-sm text-muted-foreground">No results found.</p>
  }

  return (
    <ul className="space-y-2">
      {results.map((result) => (
        <li key={result.id}>
          <Link
            href={`${hrefPrefix}/${result.id}`}
            className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted"
          >
            <div>
              <p className="text-sm font-medium">{result.title}</p>
              <p className="text-xs text-muted-foreground">{result.author}</p>
            </div>
            {result.similarity > 0 && <SimilarityBadge score={result.similarity} />}
          </Link>
        </li>
      ))}
    </ul>
  )
}
