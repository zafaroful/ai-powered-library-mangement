-- Allow admins to read all loans and reservations.
-- Uses public.is_admin() to avoid RLS recursion on users (see 009 if upgrading).

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

drop policy if exists "Users can view all profiles for admins" on users;
create policy "Users can view all profiles for admins" on users
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Admins can view all loans" on loans;
create policy "Admins can view all loans" on loans
  for select using (public.is_admin());

drop policy if exists "Admins can view all reservations" on reservations;
create policy "Admins can view all reservations" on reservations
  for select using (public.is_admin());

notify pgrst, 'reload schema';
