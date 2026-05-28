export const BOOK_CATEGORIES = [
  'Fiction',
  'Non-Fiction',
  'Science',
  'Technology',
  'History',
  'Mathematics',
  'Literature',
  'Self-Help',
  'Biography',
  'Reference',
] as const

export type BookCategory = (typeof BOOK_CATEGORIES)[number]
