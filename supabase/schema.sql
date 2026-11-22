create extension if not exists pgcrypto;
create table if not exists public.projects (
 id uuid primary key default gen_random_uuid(), title text not null, description text not null default '', category text not null default 'Other',
 status text not null default 'Planning' check(status in ('Planning','Developing','Completed','Archived')),
 tech_stack text[] not null default '{}', tags text[] not null default '{}', github_url text, demo_url text, hosting_url text, docs_url text,
 notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create index if not exists projects_updated_at_idx on public.projects(updated_at desc);
create index if not exists projects_deleted_at_idx on public.projects(deleted_at);
alter table public.projects enable row level security;
revoke all on public.projects from anon,authenticated;