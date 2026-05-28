-- Return full book rows from semantic search + allow API callers to execute RPC

create or replace function match_books(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count     int   default 10
)
returns table (
  id               uuid,
  title            text,
  author           text,
  description      text,
  cover_url        text,
  category         text,
  tags             text[],
  reading_level    text,
  page_count       int,
  total_copies     int,
  available_copies int,
  created_at       timestamptz,
  similarity       float
)
language sql stable
set search_path = public
as $$
  select
    id,
    title,
    author,
    description,
    cover_url,
    category,
    tags,
    reading_level,
    page_count,
    total_copies,
    available_copies,
    created_at,
    1 - (embedding <=> query_embedding) as similarity
  from books
  where embedding is not null
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

grant execute on function match_books(vector, real, integer) to anon;
grant execute on function match_books(vector, real, integer) to authenticated;
grant execute on function match_books(vector, real, integer) to service_role;

notify pgrst, 'reload schema';
