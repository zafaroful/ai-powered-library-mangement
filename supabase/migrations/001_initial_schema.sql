-- Core tables for library management system

create table users (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  full_name   text not null,
  role        text not null default 'student' check (role in ('admin', 'student')),
  matric_no   text,
  created_at  timestamptz default now()
);

create table books (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  author           text not null,
  isbn             text unique,
  description      text,
  cover_url        text,
  category         text,
  tags             text[],
  reading_level    text check (reading_level in ('beginner', 'intermediate', 'advanced')),
  page_count       int,
  total_copies     int not null default 1,
  available_copies int not null default 1,
  created_at       timestamptz default now()
);

create table loans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade not null,
  book_id      uuid references books(id) on delete cascade not null,
  borrowed_at  timestamptz default now(),
  due_date     timestamptz not null,
  returned_at  timestamptz,
  fine_amount  numeric(8,2) default 0
);

create table reservations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete cascade not null,
  book_id      uuid references books(id) on delete cascade not null,
  reserved_at  timestamptz default now(),
  status       text default 'pending' check (status in ('pending', 'ready', 'cancelled'))
);

-- Indexes
create index idx_loans_user_id on loans(user_id);
create index idx_loans_book_id on loans(book_id);
create index idx_loans_returned_at on loans(returned_at);
create index idx_reservations_user_id on reservations(user_id);
create index idx_reservations_book_id on reservations(book_id);
create index idx_books_category on books(category);

-- RLS policies (basic — enable RLS)
alter table users enable row level security;
alter table books enable row level security;
alter table loans enable row level security;
alter table reservations enable row level security;

-- Users can read their own profile
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

-- Anyone authenticated can read books
create policy "Authenticated users can read books" on books
  for select to authenticated using (true);

-- Admins can manage books (checked via users.role in app layer)
create policy "Service role full access books" on books
  for all using (true);

-- Users can view their own loans
create policy "Users can view own loans" on loans
  for select using (auth.uid() = user_id);

-- Users can view their own reservations
create policy "Users can view own reservations" on reservations
  for select using (auth.uid() = user_id);
