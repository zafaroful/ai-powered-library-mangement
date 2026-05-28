const SLUG_MAX = 80

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, SLUG_MAX)
    || 'book'
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export async function generateUniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
  excludeBookId?: string
): Promise<string> {
  const base = slugify(title)
  let candidate = base
  let n = 0

  while (await exists(candidate)) {
    n += 1
    candidate = `${base}-${n}`
    if (n > 100) {
      candidate = `${base}-${crypto.randomUUID().slice(0, 8)}`
      break
    }
  }

  void excludeBookId
  return candidate
}
