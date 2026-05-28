# Read Nest

A final-year-project library management system built with Next.js, Supabase, and OpenAI.

## Features

- **Role-based access**: Admin and student dashboards
- **Book management**: CRUD, inventory tracking
- **Borrowing & returns**: 14-day loan period, RM 0.50/day overdue fines
- **Reservations**: Queue for unavailable books
- **AI semantic search**: Natural language book discovery
- **Image search**: Upload or scan a book cover/barcode to find catalog matches
- **Smart recommendations**: Vector similarity suggestions
- **Auto-categorization**: GPT-powered metadata on book creation
- **Cover & PDF uploads**: Supabase Storage for book covers and PDFs
- **Book AI chat**: Student chatbot on each book page (RAG over PDF content)

## Stack

- Next.js 16 (App Router)
- Supabase (Postgres + pgvector + Auth)
- OpenAI API (`text-embedding-3-small`, `gpt-4o-mini`)
- Tailwind CSS + shadcn/ui

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

### 3. Database migrations

Run migrations in order via Supabase SQL Editor or CLI:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_enable_pgvector.sql
supabase/migrations/003_add_embeddings.sql
supabase/migrations/004_match_books_function.sql
supabase/migrations/005_auth_user_sync.sql
supabase/migrations/006_fix_admin_role_lookup.sql
supabase/migrations/007_loan_approval.sql
supabase/migrations/008_admin_loans_rls.sql
supabase/migrations/009_fix_rls_recursion.sql
supabase/migrations/010_reservations_insert_rls.sql
supabase/migrations/011_search_match_books_grant.sql
supabase/migrations/012_book_media_and_slug.sql
supabase/migrations/013_storage_policies.sql
supabase/migrations/014_user_interests.sql
supabase/migrations/015_settings_fines_reports.sql
```

After migrations, the `public` schema has eight tables: `users`, `books`, `loans`, `reservations`, `book_chunks`, `settings`, `fines`, `reports`. Library-wide config (fine rate, loan period) lives in `settings`; assessed fines in `fines`; report snapshots in `reports`. See [AGENTS.md](./AGENTS.md).

### 4. Storage buckets

Migrations `013_storage_policies.sql` creates `book-covers` (public) and `book-pdfs` (private). If buckets fail to create via SQL, add them manually in Supabase Dashboard → Storage with the same names.

### 5. Create admin account

1. Register a user via Supabase Auth dashboard or `/register`
2. Update their role in SQL:

```sql
update users set role = 'admin' where email = 'admin@example.com';
```

### 6. Run dev server

```bash
npm run dev
```

### 7. Backfill embeddings (after adding books)

```bash
curl -X POST http://localhost:3000/api/admin/backfill-embeddings \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

## Routes

| Role | Dashboard | Key pages |
|------|-----------|-----------|
| Admin | `/admin` | Books, Users, Loans, Reservations, Fines, Reports |
| Student | `/student` | Browse Books (`/student/books/{slug}`), AI chat, My Loans, Reservations, Fines |

## Project structure

See [AGENTS.md](./AGENTS.md) for full architecture and AI implementation details.

## Deploy to GitHub

### 1. Push this repository

```bash
git add .
git commit -m "Add library management app with AI features"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-powered-library-mangement.git
git push -u origin main
```

Create the empty repository on [GitHub](https://github.com/new) first (do not initialize with a README if this folder already has one).

### 2. Host on Vercel (recommended for Next.js)

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new).
2. Add environment variables from `.env.local.example`.
3. Deploy. Vercel runs `npm run build` on each push to `main`.

### 3. CI on GitHub

The workflow in `.github/workflows/ci.yml` runs `npm run build` on every push and pull request to `main`/`master`.
