create or replace function match_books(
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count     int   default 10
)
returns table (
  id          uuid,
  title       text,
  author      text,
  description text,
  similarity  float
)
language sql stable as $$
  select
    id,
    title,
    author,
    description,
    1 - (embedding <=> query_embedding) as similarity
  from books
  where embedding is not null
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
