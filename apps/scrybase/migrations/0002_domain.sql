create table if not exists project (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  user_id text not null references "user"(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  filename text not null,
  object_key text not null,
  mime_type text not null,
  size_bytes integer not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'ready', 'error')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chunk (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references document(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table if not exists api_key (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references project(id) on delete cascade,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists project_user_id_idx on project (user_id);
create index if not exists document_project_id_idx on document (project_id);
create index if not exists chunk_document_id_idx on chunk (document_id);
create index if not exists api_key_project_id_idx on api_key (project_id);
create index if not exists chunk_embedding_idx on chunk using hnsw (embedding vector_cosine_ops);
