-- Ensure authenticated users can always read their own role (for middleware / login redirect)

drop policy if exists "Users can view all profiles for admins" on users;

create policy "Users can view all profiles for admins" on users
  for select using (
    auth.uid() = id
    or exists (
      select 1 from users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );
