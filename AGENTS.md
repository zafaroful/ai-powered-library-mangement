# AGENT.md — AI-Powered Library System

This file is the single source of truth for any AI agent (Claude Code, Copilot, Cursor, etc.) working on this codebase. Read it fully before making changes.

---

## Project Overview

A final-year-project library management system built with Next.js, Supabase, and OpenAI. The system handles core library operations (books, users, borrowing, fines, reservations) augmented by four AI features: natural language semantic search, image search (cover/barcode), smart book recommendations, and auto-categorization.

**Stack:** Next.js 15 (App Router) · Supabase (Postgres + pgvector + Auth) · OpenAI API · Vercel (deployment) · Tailwind CSS · shadcn/ui

**Users:** Two roles only — **admin** and **student**. Each role signs in through the same auth flow but lands on a different dashboard with different navigation, pages, and permissions.

---

## Roles, Auth & Dashboards

### Roles

| Role | Who | Purpose |
|---|---|---|
| `admin` | Library staff / system owner | Manage books, users, inventory, fines, reservations, and view reports |
| `student` | Library members | Search/browse catalog, borrow, return, reserve, pay/view fines |

Role is stored in `users.role` and set at registration (student) or by seed/admin (admin accounts).

### Sign-in

- **Single login page** at `/login` — email + password via Supabase Auth.
- After login, **middleware** reads `users.role` and redirects:
  - `admin` → `/admin` (admin dashboard)
  - `student` → `/student` (student dashboard)
- Unauthenticated users hitting `/admin/*` or `/student/*` are sent to `/login`.
- Students register at `/register` with `role = 'student'` only. Admin accounts are seeded or created in the database — never via public registration.

### Admin vs student — features & views

| Area | Admin | Student |
|---|---|---|
| Dashboard home | Stats: loans, overdue, popular books, fines collected | My loans, due soon, reservations, fines owed |
| Books | Full CRUD, stock, auto-categorize on add | Browse, search (keyword + semantic), view detail |
| Users | List/manage students | Profile only (own account) |
| Borrow requests | Approve/reject pending requests; issue loans directly | Submit request → await approval; view own loans |
| Return books | Process returns for any user | Return own active loans |
| Reservations | Manage queue, mark ready for pickup | Reserve unavailable books; own queue |
| Fines | View all fines | View own fines |
| Reports & analytics | Borrowing trends, popular books, overdue | — |
| AI: semantic search | ✓ | ✓ (primary discovery) |
| AI: image search | ✓ | ✓ (cover/barcode upload or scan) |
| AI: recommendations | ✓ | ✓ |
| AI: auto-categorization | ✓ (book form) | — |
| Admin API (backfill embeddings) | ✓ | — |

### Route layout (by role)

```
app/
├── (auth)/
│   ├── login/page.tsx          # Shared sign-in → redirect by role
│   └── register/page.tsx       # Student only (role = student)
├── (admin)/                    # Admin layout + sidebar
│   ├── layout.tsx
│   ├── page.tsx
│   ├── books/
│   ├── users/
│   ├── loans/
│   ├── reservations/
│   ├── fines/
│   └── reports/
└── (student)/                  # Student layout + navbar
    ├── layout.tsx
    ├── page.tsx
    ├── books/
    ├── borrow/
    ├── reservations/
    └── fines/
```

Use **separate route groups** `(admin)` and `(student)` so layouts and nav do not mix. Shared UI in `components/`; shells in `AdminSidebar.tsx` and `StudentNavbar.tsx`.

---

## Folder Structure

```
library-system/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no app chrome)
│   │   ├── login/
│   │   │   └── page.tsx          # Shared sign-in → redirect by role
│   │   └── register/
│   │       └── page.tsx          # Student registration (role = student)
│   ├── (admin)/                  # Admin-only routes + layout
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Admin dashboard (stats)
│   │   ├── books/                # CRUD, inventory, auto-categorize
│   │   ├── users/                # Manage students
│   │   ├── loans/                # Pending approval tab + active/overdue/returned
│   │   ├── reservations/
│   │   ├── fines/
│   │   └── reports/              # Analytics
│   ├── (student)/                # Student-only routes + layout
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Student dashboard (my activity)
│   │   ├── books/                # Browse, search, detail, borrow/reserve
│   │   ├── borrow/               # My active loans
│   │   ├── reservations/
│   │   └── fines/                # My fines
│   └── api/                      # API routes (server-side only)
│       ├── search/
│       │   ├── route.ts          # Text + ISBN search endpoint
│       │   └── image/
│       │       └── route.ts      # Cover photo vision search
│       ├── recommend/
│       │   └── route.ts          # Book recommendations endpoint
│       ├── books/
│       │   └── route.ts          # Book CRUD
│       ├── loans/
│       │   ├── route.ts          # POST borrow request / admin direct issue
│       │   └── [id]/
│       │       ├── route.ts      # PATCH approve | reject (admin)
│       │       └── return/
│       │           └── route.ts  # POST return active loan
│       └── admin/
│           └── backfill-embeddings/
│               └── route.ts      # One-time embedding backfill
│
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui base components (do not edit)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── AdminSidebar.tsx      # Admin nav links
│   │   └── StudentNavbar.tsx     # Student nav links
│   ├── auth/
│   │   └── RoleGuard.tsx         # Hide UI blocks by role
│   ├── books/
│   │   ├── BookCard.tsx          # Book display card
│   │   ├── BookGrid.tsx          # Grid of BookCards
│   │   └── BookForm.tsx          # Add/edit book form
│   ├── search/
│   │   ├── SmartSearch.tsx       # Semantic search input + results
│   │   ├── ImageSearch.tsx       # Cover/barcode upload + camera scan
│   │   └── SearchResults.tsx     # Result list with similarity scores
│   ├── borrow/
│   │   ├── BorrowButton.tsx          # Student: creates pending request
│   │   ├── LoanCard.tsx              # Shows status; admin approval actions
│   │   ├── LoanApprovalActions.tsx   # Admin: Approve / Reject (pending only)
│   │   └── ReturnLoanButton.tsx
│   └── recommendations/
│       └── RecommendationStrip.tsx  # "You might also like" row
│
├── lib/                          # Shared utilities (no React)
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── server.ts             # Server Supabase client (RSC / API routes)
│   │   └── admin.ts              # Service-role client (admin ops only)
│   ├── openai/
│   │   └── embeddings.ts         # getEmbedding() utility
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useBooks.ts
│   │   └── useUser.ts
│   ├── loans/
│   │   └── status.ts             # isPendingLoan, isActiveLoan, etc.
│   └── utils/
│       ├── fines.ts              # Fine calculation logic
│       └── dates.ts              # Due date helpers
│
├── types/
│   └── index.ts                  # All shared TypeScript types
│
├── supabase/
│   └── migrations/               # SQL migration files (run in order)
│       ├── 001_initial_schema.sql
│       ├── 002_enable_pgvector.sql
│       ├── 003_add_embeddings.sql
│       ├── 004_match_books_function.sql
│       ├── 005_auth_user_sync.sql
│       ├── 006_fix_admin_role_lookup.sql
│       ├── 007_loan_approval.sql      # pending | active | rejected
│       ├── 008_admin_loans_rls.sql    # admins can SELECT all loans/reservations
│       └── 009_fix_rls_recursion.sql  # is_admin() — run if "infinite recursion" on users
│
├── middleware.ts                  # Auth + role-based redirect (/admin vs /student)
├── .env.local                    # Local secrets (never commit)
├── AGENT.md                      # This file
└── README.md
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only, never expose to client
OPENAI_API_KEY=                  # server-side only
```

**Rule:** Any variable without `NEXT_PUBLIC_` prefix must never be used in a client component. If you need it client-side, proxy it through an API route.

---

## Database Schema

### Core tables

```sql
-- 001_initial_schema.sql

create table users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  full_name   text not null,
  role        text not null default 'student',  -- 'admin' | 'student'
  matric_no   text,
  created_at  timestamptz default now()
);

create table books (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  author       text not null,
  isbn         text unique,
  description  text,
  cover_url    text,
  category     text,
  tags         text[],
  reading_level text,              -- 'beginner' | 'intermediate' | 'advanced'
  page_count   int,
  total_copies int not null default 1,
  available_copies int not null default 1,
  created_at   timestamptz default now()
);

create table loans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  book_id      uuid references books(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending', 'active', 'rejected')),
  borrowed_at  timestamptz,        -- null until approved (or admin direct issue)
  due_date     timestamptz,        -- null until approved; set via getDueDate()
  returned_at  timestamptz,
  fine_amount  numeric(8,2) default 0
);

-- 007_loan_approval.sql: unique pending request per user+book
-- create unique index idx_loans_pending_user_book on loans (user_id, book_id) where status = 'pending';

create table reservations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade,
  book_id      uuid references books(id) on delete cascade,
  reserved_at  timestamptz default now(),
  status       text default 'pending'  -- 'pending' | 'ready' | 'cancelled'
);
```

### AI tables

```sql
-- 002_enable_pgvector.sql
create extension if not exists vector;

-- 003_add_embeddings.sql
alter table books add column embedding vector(1536);
create index on books using ivfflat (embedding vector_cosine_ops) with (lists = 100);
```

---

## Feature List

### Core (non-AI) — by role

| Feature | Admin | Student | Route / notes |
|---|---|---|---|
| Book CRUD | ✓ create/edit/delete | browse only | `(admin)/books/` vs `(student)/books/` |
| User management | ✓ list/manage students | own profile | `(admin)/users/` |
| Borrow approval | ✓ approve/reject pending | submit request only | `(admin)/loans/` Pending tab |
| Borrow / return | ✓ direct issue + all returns | own loans | `POST /api/loans`, `PATCH /api/loans/[id]` |
| Fine calculation | view all | view own | `lib/utils/fines.ts` — RM 0.50/day overdue |
| Reservations | manage queue | reserve & view own | respective route groups |
| Search (keyword) | ✓ | ✓ | Supabase `ilike` fallback on books pages |
| Reports & analytics | ✓ | — | `(admin)/reports/` only |

Auth: Supabase Auth + `users.role`. Registration creates **student** by default; **admin** accounts are seeded or promoted in DB.

### AI Features — by role

| Feature | Admin | Student | Endpoint |
|---|---|---|---|
| Semantic search | ✓ | ✓ | `GET /api/search?q=` |
| Image search | ✓ | ✓ | `GET /api/search?isbn=` · `POST /api/search/image` |
| Smart recommendations | ✓ | ✓ | `GET /api/recommend?bookId=` |
| Auto-categorization | ✓ (book form) | — | book create flow in admin |
| Embedding backfill | ✓ | — | `POST /api/admin/backfill-embeddings` |

---

## Borrow Approval Workflow

Students do **not** get instant loans. They submit a **borrow request** (`status: pending`). An admin approves or rejects it on the Loans page. Admins can also **issue a loan directly** (skips approval) when checking out on behalf of a student.

### Status flow

```
Student clicks "Request to Borrow"
        │
        ▼
   pending  ──admin Approve──►  active  ──return──►  returned (returned_at set)
        │
        └──admin Reject──►  rejected  (copy restored to available_copies)
```

| Status | Meaning | `borrowed_at` / `due_date` | Copy count |
|---|---|---|---|
| `pending` | Awaiting admin | `null` | Decremented on request (held) |
| `active` | Approved loan | Set on approve | Already held |
| `rejected` | Denied | `null` | Restored on reject |
| returned | `returned_at` set | Was active | Restored on return |

### Who does what

| Action | Student | Admin |
|---|---|---|
| Request borrow | `POST /api/loans` `{ book_id }` → `pending` | — |
| Direct issue (no approval) | — | `POST /api/loans` `{ book_id, user_id }` → `active` immediately |
| Approve request | — | `PATCH /api/loans/[id]` `{ status: 'active' }` |
| Reject request | — | `PATCH /api/loans/[id]` `{ status: 'rejected' }` |
| Return book | `POST /api/loans/[id]/return` (own loan) | Same endpoint (any loan) |

**Rules:**
- One pending request per student per book (DB unique index + API check).
- Only `pending` loans can be approved/rejected (`PATCH` is admin-only via `requireRole('admin')`).
- Pending requests reserve a copy (`available_copies - 1` on `POST`); reject restores it.
- Due date is computed with `getDueDate()` from `lib/utils/dates.ts` only when status becomes `active`.

### UI

| Role | Page | What they see |
|---|---|---|
| Student | `(student)/books/[id]` | `BorrowButton` → "Request to Borrow" |
| Student | `(student)/borrow/` | Tabs: Pending approval, Active, History |
| Student | `(student)/` dashboard | "Awaiting Approval" card when pending > 0 |
| Admin | `(admin)/loans/` | Tabs: **Pending** (default if any), Active, Overdue, Returned |
| Admin | Pending tab | `LoanCard` with `showApprovalActions` → `LoanApprovalActions` |

**Key files:**
- `app/api/loans/route.ts` — create request or admin direct issue
- `app/api/loans/[id]/route.ts` — approve / reject
- `app/api/loans/[id]/return/route.ts` — return active loan
- `components/borrow/LoanApprovalActions.tsx` — Approve / Reject buttons
- `lib/loans/status.ts` — `isPendingLoan`, `isActiveLoan`, `isRejectedLoan`
- `supabase/migrations/007_loan_approval.sql`

---

## AI Implementation Details

### 1. Semantic Search

**How it works:**
1. User types a natural-language query (e.g. "machine learning for beginners").
2. Frontend calls `GET /api/search?q=...` with 500ms debounce.
3. API route calls `getEmbedding(query)` via OpenAI.
4. Supabase RPC `match_books()` finds books whose stored embedding is within cosine distance threshold.
5. Results returned ranked by similarity score (0–1).

**Key file:** `app/api/search/route.ts`
```ts
import { createClient } from '@/lib/supabase/server'
import { getEmbedding } from '@/lib/openai/embeddings'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query) return Response.json({ results: [] })

  const supabase = createClient()
  const embedding = await getEmbedding(query)

  const { data, error } = await supabase.rpc('match_books', {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 10,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ results: data })
}
```

**SQL function:** `supabase/migrations/004_match_books_function.sql`
```sql
create or replace function match_books(
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count     int   default 10
)
returns table (
  id          uuid,
  title       text,
  author      text,
  description text,
  similarity  float
)
language sql stable as $$
  select id, title, author, description,
         1 - (embedding <=> query_embedding) as similarity
  from books
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
```

**Hybrid search strategy:** Always run semantic search AND a keyword `ilike` search in parallel, then merge and deduplicate results. Semantic search handles conceptual queries; keyword handles exact title/author matches.

```ts
// Run both in parallel
const [semanticResults, keywordResults] = await Promise.all([
  supabase.rpc('match_books', { query_embedding: embedding, ... }),
  supabase.from('books').select('*').ilike('title', `%${query}%`)
])

// Merge: semantic results first, append keyword-only matches
const seen = new Set(semanticResults.data?.map(r => r.id))
const merged = [
  ...(semanticResults.data ?? []),
  ...(keywordResults.data ?? []).filter(r => !seen.has(r.id))
]
```

---

### 2. Smart Recommendations

**How it works:**
1. When a user views a book detail page, call `GET /api/recommend?bookId=X`.
2. API fetches that book's stored embedding.
3. Runs `match_books()` with that embedding (excluding the current book).
4. Returns top 5 most similar books.

No GPT call needed — pure vector similarity in Postgres.

**Key file:** `app/api/recommend/route.ts`
```ts
export async function GET(req: NextRequest) {
  const bookId = req.nextUrl.searchParams.get('bookId')
  const supabase = createClient()

  // Fetch the source book's embedding
  const { data: book } = await supabase
    .from('books')
    .select('embedding')
    .eq('id', bookId)
    .single()

  if (!book?.embedding) return Response.json({ results: [] })

  const { data } = await supabase.rpc('match_books', {
    query_embedding: book.embedding,
    match_threshold: 0.70,
    match_count: 6,        // fetch 6, filter out self in display
  })

  const results = (data ?? []).filter(r => r.id !== bookId).slice(0, 5)
  return Response.json({ results })
}
```

---

### 3. Auto-Categorization

**How it works:**
1. Admin fills in title + description when adding a new book.
2. On blur from the description field (or on form submit), call OpenAI.
3. GPT returns structured JSON: `{ category, tags, reading_level }`.
4. Pre-populate the remaining form fields. Admin can override.

**This is a GPT call, not an embedding call.** Use `gpt-4o-mini` for cost efficiency.

**Key file:** `app/api/books/categorize/route.ts`
```ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { title, description } = await req.json()

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [{
      role: 'system',
      content: `You are a library cataloguer. Given a book title and description, 
      return ONLY a JSON object with these exact keys:
      - category: one of [Fiction, Non-Fiction, Science, Technology, History, 
        Mathematics, Literature, Self-Help, Biography, Reference]
      - tags: array of 3-5 lowercase topic tags
      - reading_level: one of [beginner, intermediate, advanced]`
    }, {
      role: 'user',
      content: `Title: ${title}\nDescription: ${description}`
    }]
  })

  const result = JSON.parse(completion.choices[0].message.content ?? '{}')
  return Response.json(result)
}
```

---

### 4. Image Search

**How it works:**
1. User uploads a photo or scans a barcode with the camera (`ImageSearch.tsx`).
2. Client-side ZXing decodes EAN/ISBN barcodes → `GET /api/search?isbn=...` for exact catalog match.
3. If no barcode, image is sent to `POST /api/search/image` → GPT-4o-mini vision extracts title/author/ISBN.
4. Extracted metadata runs the same hybrid semantic + keyword search as text search.

**Key files:** `components/search/ImageSearch.tsx`, `app/api/search/image/route.ts`, `lib/openai/vision.ts`, `lib/search/books.ts`

Barcode lookup requires ISBN stored on books (`BookForm` ISBN field). Cover search works best when embeddings are backfilled.

---

### 5. Embedding Utility

**Key file:** `lib/openai/embeddings.ts`
```ts
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',  // 1536 dimensions, ~$0.02/million tokens
    input: text.replace(/\n/g, ' '),  // normalise whitespace
  })
  return response.data[0].embedding
}

// Used when embedding a book: combine title + description for best quality
export function bookToEmbeddingText(book: { title: string; description: string }): string {
  return `${book.title}. ${book.description}`
}
```

---

### 6. Backfill Job

Run once after deployment to embed all existing books. Call via `curl` or Postman with the service-role key in the header:

```
POST /api/admin/backfill-embeddings
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
```

**Key file:** `app/api/admin/backfill-embeddings/route.ts`
```ts
import { createClient } from '@/lib/supabase/admin'
import { getEmbedding, bookToEmbeddingText } from '@/lib/openai/embeddings'

export async function POST() {
  const supabase = createClient()

  const { data: books } = await supabase
    .from('books')
    .select('id, title, description')
    .is('embedding', null)

  let embedded = 0
  for (const book of books ?? []) {
    const embedding = await getEmbedding(bookToEmbeddingText(book))
    await supabase.from('books').update({ embedding }).eq('id', book.id)
    await new Promise(r => setTimeout(r, 200))  // rate limit buffer
    embedded++
  }

  return Response.json({ embedded })
}
```

Also call `getEmbedding()` + update inside the book creation API route so new books are embedded on insert — no manual re-run needed.

---

## Design System

This project uses **shadcn/ui** on top of **Tailwind CSS**. The design tokens live in `app/globals.css` as CSS variables and are consumed by Tailwind via `tailwind.config.ts`.

### Colour tokens (CSS variables)

```css
/* app/globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;       /* main brand blue */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;       /* red for fines, overdue */
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode overrides ... */
}
```

All colors in components use `bg-primary`, `text-muted-foreground`, etc. — never raw hex values. This keeps dark mode working automatically.

### Typography scale

| Usage | Class | Size |
|---|---|---|
| Page headings | `text-2xl font-semibold` | 24px |
| Section headings | `text-lg font-medium` | 18px |
| Body | `text-sm` | 14px |
| Captions / labels | `text-xs text-muted-foreground` | 12px |

### Component conventions

All UI primitives come from `components/ui/` (shadcn). Never rewrite Button, Input, Card, Badge, Dialog — extend them via `className` props instead.

```tsx
// Correct — extend via className
<Button className="w-full" variant="outline">Borrow</Button>

// Wrong — create a new button from scratch
<button className="bg-blue-500 text-white px-4 py-2 rounded">Borrow</button>
```

### Role-based UI

Use `users.role` (`admin` | `student`) to gate UI within a layout. Prefer **separate route groups** for whole pages; use `<RoleGuard>` only for small shared components:

```tsx
// components/auth/RoleGuard.tsx
export function RoleGuard({
  role,
  children,
}: {
  role: 'admin' | 'student'
  children: React.ReactNode
}) {
  const { user } = useUser()
  if (user?.role !== role) return null
  return <>{children}</>
}
```

**Admin nav** (example): Dashboard, Books, Users, Loans, Reservations, Fines, Reports.  
**Student nav** (example): Home, Browse Books, My Loans, Reservations, Fines.

Route-level protection: `middleware.ts` checks session, loads role, redirects wrong-role access from `/admin/*` or `/student/*`.

### Similarity score display

Show AI confidence to the user. Use a colour-coded badge on search results:

```tsx
function SimilarityBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const variant = pct >= 90 ? 'default' : pct >= 75 ? 'secondary' : 'outline'
  return <Badge variant={variant}>{pct}% match</Badge>
}
```

---

## Supabase Client Rules

| Context | Client to use | File |
|---|---|---|
| React Server Components | `lib/supabase/server.ts` | Uses `cookies()` from `next/headers` |
| Client components | `lib/supabase/client.ts` | Uses `createBrowserClient` |
| API routes (admin ops) | `lib/supabase/admin.ts` | Uses `SUPABASE_SERVICE_ROLE_KEY` |

Never import the admin client in a client component — the service role key would be exposed to the browser.

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}
```

---

## Auth & Middleware

```ts
// middleware.ts — pattern (implement fully in repo)
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createServerClient(/* ... cookie handlers ... */)

  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  const isAuthRoute = path.startsWith('/login') || path.startsWith('/register')
  const isAdminRoute = path.startsWith('/admin')
  const isStudentRoute = path.startsWith('/student')

  if (!session && (isAdminRoute || isStudentRoute)) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && (isAdminRoute || isStudentRoute || isAuthRoute)) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = profile?.role as 'admin' | 'student' | undefined
    const home = role === 'admin' ? '/admin' : '/student'

    if (isAuthRoute) return NextResponse.redirect(new URL(home, req.url))
    if (role === 'admin' && isStudentRoute) return NextResponse.redirect(new URL('/admin', req.url))
    if (role === 'student' && isAdminRoute) return NextResponse.redirect(new URL('/student', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next|favicon.ico).*)'],
}
```

After login on `/login`, redirect to `/admin` or `/student` based on `users.role`. Students register at `/register` with `role = 'student'`; do not expose public admin registration.

---

## TypeScript Types

```ts
// types/index.ts

export type Role = 'admin' | 'student'
export type ReadingLevel = 'beginner' | 'intermediate' | 'advanced'
export type LoanApprovalStatus = 'pending' | 'active' | 'rejected'
export type ReservationStatus = 'pending' | 'ready' | 'cancelled'

export interface User {
  id: string
  email: string
  full_name: string
  role: Role
  matric_no?: string
  created_at: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn?: string
  description?: string
  cover_url?: string
  category?: string
  tags?: string[]
  reading_level?: ReadingLevel
  page_count?: number
  total_copies: number
  available_copies: number
  embedding?: number[]          // not returned in normal queries
  created_at: string
}

export interface Loan {
  id: string
  user_id: string
  book_id: string
  status: LoanApprovalStatus   // pending | active | rejected
  borrowed_at?: string         // set when status becomes active
  due_date?: string            // set when status becomes active
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
}

export interface SearchResult extends Pick<Book, 'id' | 'title' | 'author' | 'description'> {
  similarity: number            // 0–1, from pgvector cosine match
}

export interface AutoCategorizeResult {
  category: string
  tags: string[]
  reading_level: ReadingLevel
}
```

---

## Key Decisions & Rationale

**Why `text-embedding-3-small` and not `text-embedding-3-large`?**
`small` produces 1536-dimensional vectors, costs ~20× less, and performs well on short text like book descriptions. Use `large` only if search quality is noticeably poor after testing.

**Why store embeddings in Supabase and not a dedicated vector DB (Pinecone, Weaviate)?**
pgvector inside Postgres is sufficient for up to ~1 million vectors with the `ivfflat` index. A library system will have thousands of books at most — no separate service needed, and it keeps the architecture simple.

**Why not stream the GPT response for auto-categorization?**
Auto-categorization returns a small JSON object. Streaming adds complexity for no UX benefit. Return the full response at once.

**Why hybrid search (semantic + keyword)?**
Semantic search can miss exact title matches (e.g. searching "Harry Potter" should surface the exact book, not just thematically similar ones). Keyword `ilike` handles precision; semantic handles recall.

**Why admin approval for student borrows?**
Matches real library desk workflow: staff verify eligibility and availability before checkout. Pending requests hold a copy so two students cannot both think they got the last copy. Admins can still bypass approval with direct issue (`POST` with `user_id`) for walk-in checkouts.

**Why `gpt-4o-mini` for auto-categorization?**
The task is structured classification with a fixed output schema. `gpt-4o-mini` handles it accurately at ~5× lower cost than `gpt-4o`.

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Set up .env.local with the four required variables

# 3. Run Supabase migrations (in order) via Supabase SQL editor
#    or using the Supabase CLI: supabase db push
#    Required for borrow requests: run 007_loan_approval.sql
#    (error: "Could not find the 'status' column of 'loans'" means 007 was not applied)
#    Required for admin pending queue: run 008_admin_loans_rls.sql
#    (admin Loans page empty while students see requests = 008 not applied)
#    If admin Loans shows "infinite recursion" on users: run 009_fix_rls_recursion.sql

# 4. Run the dev server
npm run dev

# 5. After adding books, trigger the backfill once:
curl -X POST http://localhost:3000/api/admin/backfill-embeddings
```

---

## What NOT to Do

- Never call `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` from a client component.
- Never store raw embedding arrays in React state — they are 1536 numbers and will bloat memory.
- Never skip the similarity threshold — without it, pgvector returns results even for completely unrelated queries.
- Never call OpenAI on every keystroke — always debounce search input by at least 500ms.
- Never embed only the book title — always combine `title + description` for richer semantic coverage.
- Never edit files in `components/ui/` directly — use `className` props or create wrapper components.
- Never put admin-only pages under `(student)/` or student flows under `(admin)/` — use separate route groups and middleware role checks.
- Never allow `register` to create `admin` accounts without server-side validation.
- Never set `borrowed_at` / `due_date` on student `POST /api/loans` — only on admin approve or admin direct issue.
- Never approve/reject loans that are not `status: 'pending'`.