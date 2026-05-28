-- Link Supabase Auth users to public.users table
-- Run after enabling Supabase Auth

-- Allow users to insert their own profile on registration
create policy "Users can insert own profile" on users
  for insert with check (auth.uid() = id);

-- Admins can view all users (service role handles admin ops via API)
create policy "Users can view all profiles for admins" on users
  for select using (
    exists (
      select 1 from users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );
