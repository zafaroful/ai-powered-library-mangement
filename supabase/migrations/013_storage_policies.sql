-- Storage buckets for book covers (public) and PDFs (private)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('book-covers', 'book-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('book-pdfs', 'book-pdfs', false, 52428800, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for covers
create policy "Public read book covers"
  on storage.objects for select
  using (bucket_id = 'book-covers');

-- Authenticated users can read PDFs (signed URLs also work via service role)
create policy "Authenticated read book pdfs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'book-pdfs');

-- Service role handles uploads via API (bypasses RLS with admin client)
