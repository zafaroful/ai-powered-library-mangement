export type Role = 'admin' | 'student'
export type ReadingLevel = 'beginner' | 'intermediate' | 'advanced'
export type LoanStatus = 'active' | 'returned' | 'overdue'
export type LoanApprovalStatus = 'pending' | 'active' | 'rejected'
export type ReservationStatus = 'pending' | 'ready' | 'cancelled'

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  matric_no?: string
  interests?: string[]
  created_at: string
}

export interface Book {
  id: string
  slug: string
  title: string
  author: string
  isbn?: string
  description?: string
  cover_url?: string
  cover_path?: string
  pdf_path?: string
  pdf_processed_at?: string
  category?: string
  tags?: string[]
  reading_level?: ReadingLevel
  page_count?: number
  total_copies: number
  available_copies: number
  embedding?: number[]
  created_at: string
}

export interface BookChunk {
  id: string
  book_id: string
  chunk_index: number
  content: string
  similarity?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface Loan {
  id: string
  user_id: string
  book_id: string
  status: LoanApprovalStatus
  borrowed_at?: string
  due_date?: string
  returned_at?: string
  fine_amount: number
  book?: Book
  user?: User
}

export interface Reservation {
  id: string
  user_id: string
  book_id: string
  reserved_at: string
  status: ReservationStatus
  book?: Book
  user?: User
}

export interface LibrarySettings {
  id: number
  fine_rate_per_day: number
  default_loan_days: number
  updated_at: string | null
  updated_by: string | null
}

export type FineStatus = 'assessed' | 'paid' | 'waived'

export interface Fine {
  id: string
  loan_id: string
  user_id: string
  book_id: string
  amount: number
  days_overdue: number
  status: FineStatus
  assessed_at: string
  paid_at?: string | null
  created_at?: string
  loan?: Loan
  book?: Book
  user?: User
}

export interface ReportMetrics {
  loansCount: number
  overdueCount: number
  availableBooks: number
  totalBooks: number
  totalFinesCollected: number
  popularBooks: { title: string; count: number }[]
}

export interface ReportSnapshot {
  id: string
  report_type: string
  period_start: string
  period_end: string
  metrics: ReportMetrics
  generated_at: string
  generated_by?: string | null
}

export interface SearchResult extends Pick<Book, 'id' | 'title' | 'author' | 'description'> {
  similarity: number
}

export type SearchMatchType = 'isbn' | 'cover' | 'text'

export interface ExtractedBookMetadata {
  title?: string
  author?: string
  isbn?: string
  confidence?: number
}

export interface SearchResponse {
  results: Book[]
  matchType?: SearchMatchType
  extracted?: ExtractedBookMetadata
  error?: string
}

export interface ImageSearchMeta {
  matchType?: SearchMatchType
  extracted?: ExtractedBookMetadata
  query?: string
}

export interface AutoCategorizeResult {
  category: string
  tags: string[]
  reading_level: ReadingLevel
}
