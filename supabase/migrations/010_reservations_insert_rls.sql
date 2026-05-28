-- Students can create their own reservations when a book is unavailable

drop policy if exists "Users can create own reservations" on reservations;
create policy "Users can create own reservations" on reservations
  for insert with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
