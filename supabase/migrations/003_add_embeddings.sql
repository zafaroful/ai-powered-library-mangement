alter table books add column embedding vector(1536);

create index books_embedding_idx on books
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
