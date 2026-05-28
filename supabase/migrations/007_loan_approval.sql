-- Add loan approval workflow: pending -> active | rejected
-- Run in Supabase Dashboard → SQL Editor if borrow fails with "status column" error.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'loans'
      and column_name = 'status'
  ) then
    alter table loans
      add column status text not null default 'pending'
        check (status in ('pending', 'active', 'rejected'));
  end if;
end $$;

-- Allow null due_date until admin approves
alter table loans alter column due_date drop not null;

-- Existing rows were instant borrows; mark them active (not pending requests)
update loans
set status = 'active'
where status = 'pending'
  and borrowed_at is not null;

alter table loans alter column borrowed_at drop not null;

create unique index if not exists idx_loans_pending_user_book
  on loans (user_id, book_id)
  where status = 'pending';

-- Refresh PostgREST schema cache (fixes "status column not in schema cache")
notify pgrst, 'reload schema';
