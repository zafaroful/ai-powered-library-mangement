/** Escape special characters for PostgREST ilike patterns */
export function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

export function ilikePattern(value: string): string {
  return `%${escapeIlikePattern(value.trim())}%`
}
