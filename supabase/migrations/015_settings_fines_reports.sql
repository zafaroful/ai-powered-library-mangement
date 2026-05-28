-- Library settings, fine ledger, and report snapshots

create table settings (
  id                 int primary key default 1 check (id = 1),
  fine_rate_per_day  numeric(8,2) not null default 0.50,
  default_loan_days  int not null default 14 check (default_loan_days > 0),
  updated_at         timestamptz default now(),
  updated_by         uuid references users(id) on delete set null
);

insert into settings (id) values (1) on conflict (id) do nothing;

create table fines (
  id            uuid primary key default gen_random_uuid(),
  loan_id       uuid references loans(id) on delete cascade not null unique,
  user_id       uuid references users(id) on delete cascade not null,
  book_id       uuid references books(id) on delete cascade not null,
  amount        numeric(8,2) not null check (amount >= 0),
  days_overdue  int not null default 0 check (days_overdue >= 0),
  status        text not null default 'assessed'
                  check (status in ('assessed', 'paid', 'waived')),
  assessed_at   timestamptz not null default now(),
  paid_at       timestamptz,
  created_at    timestamptz default now()
);

create index idx_fines_user_id on fines(user_id);
create index idx_fines_book_id on fines(book_id);
create index idx_fines_assessed_at on fines(assessed_at);

-- Backfill fines from existing loan returns
insert into fines (loan_id, user_id, book_id, amount, days_overdue, status, assessed_at)
select
  l.id,
  l.user_id,
  l.book_id,
  l.fine_amount,
  greatest(0, ceil(extract(epoch from (l.returned_at - l.due_date)) / 86400)::int),
  'assessed',
  l.returned_at
from loans l
where l.fine_amount > 0
  and l.returned_at is not null
  and l.due_date is not null
on conflict (loan_id) do nothing;

create table reports (
  id             uuid primary key default gen_random_uuid(),
  report_type    text not null default 'dashboard_30d',
  period_start   date not null,
  period_end     date not null,
  metrics        jsonb not null,
  generated_at   timestamptz default now(),
  generated_by   uuid references users(id) on delete set null
);

create unique index idx_reports_period on reports (report_type, period_start, period_end);
create index idx_reports_generated_at on reports (generated_at desc);

-- RLS
alter table settings enable row level security;
alter table fines enable row level security;
alter table reports enable row level security;

create policy "Authenticated users can read settings" on settings
  for select to authenticated using (true);

create policy "Admins can update settings" on settings
  for update using (public.is_admin());

create policy "Users can view own fines" on fines
  for select using (auth.uid() = user_id);

create policy "Admins can view all fines" on fines
  for select using (public.is_admin());

create policy "Admins can manage reports" on reports
  for all using (public.is_admin());

notify pgrst, 'reload schema';
