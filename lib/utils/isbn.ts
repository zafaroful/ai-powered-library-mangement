/** Strip separators and normalize to ISBN-13 when possible. */
export function normalizeIsbn(value: string): string {
  const cleaned = value.replace(/[^0-9Xx]/g, '').toUpperCase()

  if (cleaned.length === 10) {
    return isbn10ToIsbn13(cleaned)
  }

  if (cleaned.length === 13) {
    return cleaned
  }

  return cleaned
}

function isbn10ToIsbn13(isbn10: string): string {
  const core = isbn10.slice(0, 9)
  const prefix = `978${core}`
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = Number(prefix[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }
  const check = (10 - (sum % 10)) % 10
  return `${prefix}${check}`
}

function isbn13CheckDigit(isbn13: string): boolean {
  if (isbn13.length !== 13 || !/^\d{13}$/.test(isbn13)) return false
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = Number(isbn13[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }
  const check = (10 - (sum % 10)) % 10
  return check === Number(isbn13[12])
}

function isbn10CheckDigit(isbn10: string): boolean {
  if (isbn10.length !== 10) return false
  let sum = 0
  for (let i = 0; i < 9; i++) {
    const char = isbn10[i]
    const value = char === 'X' ? 10 : Number(char)
    if (Number.isNaN(value)) return false
    sum += value * (10 - i)
  }
  const check = sum % 11
  const expected = check === 0 ? '0' : check === 1 ? 'X' : String(11 - check)
  return isbn10[9] === expected
}

export function isValidIsbn(value: string): boolean {
  const cleaned = value.replace(/[^0-9Xx]/g, '').toUpperCase()
  if (cleaned.length === 13) return isbn13CheckDigit(cleaned)
  if (cleaned.length === 10) return isbn10CheckDigit(cleaned)
  return false
}

/** ISBN variants to try against stored values (with/without hyphens). */
export function isbnLookupVariants(value: string): string[] {
  const normalized = normalizeIsbn(value)
  const variants = new Set<string>([value.trim(), normalized])

  if (normalized.length === 13) {
    variants.add(
      `${normalized.slice(0, 3)}-${normalized.slice(3, 4)}-${normalized.slice(4, 10)}-${normalized.slice(10, 12)}-${normalized.slice(12)}`
    )
  }

  if (normalized.length === 13 && normalized.startsWith('978')) {
    const isbn10Core = normalized.slice(3, 12)
    const check = normalized[12]
    variants.add(`${isbn10Core}${check}`)
  }

  return [...variants].filter(Boolean)
}
