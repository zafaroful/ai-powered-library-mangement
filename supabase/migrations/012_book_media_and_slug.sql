-- Book slug, media paths, and RAG chunks

alter table books add column if not exists slug text;
alter table books add column if not exists cover_path text;
alter table books add column if not exists pdf_path text;
alter table books add column if not exists pdf_processed_at timestamptz;

-- Backfill slug from title for existing rows
update books
set slug = lower(regexp_replace(regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'))
  || '-' || substr(id::text, 1, 8)
where slug is null or slug = '';

-- Resolve duplicate slugs
with numbered as (
  select id, slug,
    row_number() over (partition by slug order by created_at) as rn
  from books
)
update books b
set slug = b.slug || '-' || n.rn
from numbered n
where b.id = n.id and n.rn > 1;

alter table books alter column slug set not null;
create unique index if not exists books_slug_idx on books(slug);

create table if not exists book_chunks (
  id           uuid primary key default gen_random_uuid(),
  book_id      uuid not null references books(id) on delete cascade,
  chunk_index  int not null,
  content      text not null,
  embedding    vector(1536),
  created_at   timestamptz default now()
);

create index if not exists book_chunks_book_id_idx on book_chunks(book_id);

create index if not exists book_chunks_embedding_idx on book_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

alter table book_chunks enable row level security;

create policy "Authenticated users can read book chunks" on book_chunks
  for select to authenticated using (true);

create or replace function match_book_chunks(
  p_book_id         uuid,
  query_embedding   vector(1536),
  match_threshold   float default 0.5,
  match_count       int   default 8
)
returns table (
  id          uuid,
  chunk_index int,
  content     text,
  similarity  float
)
language sql stable as $$
  select
    id,
    chunk_index,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from book_chunks
  where book_id = p_book_id
    and embedding is not null
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

grant execute on function match_book_chunks(uuid, vector, float, int) to authenticated;
grant execute on function match_book_chunks(uuid, vector, float, int) to service_role;
