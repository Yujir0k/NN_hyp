create table if not exists projects (
  id text primary key,
  payload jsonb not null,
  created_at timestamptz default now()
);

create table if not exists runs (
  id text primary key,
  project_id text not null,
  status text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

create table if not exists audit_log (
  id text primary key,
  kind text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

