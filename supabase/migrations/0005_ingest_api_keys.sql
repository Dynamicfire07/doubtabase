create extension if not exists pgcrypto;

create table if not exists public.user_ingest_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null check (char_length(key_prefix) between 8 and 48),
  created_at timestamptz not null default timezone('utc', now()),
  last_used_at timestamptz null,
  revoked_at timestamptz null
);

create index if not exists user_ingest_keys_user_id_idx
  on public.user_ingest_keys (user_id);

create unique index if not exists user_ingest_keys_one_active_per_user_idx
  on public.user_ingest_keys (user_id)
  where revoked_at is null;

alter table public.user_ingest_keys enable row level security;

drop policy if exists "Users can view own ingest keys" on public.user_ingest_keys;
drop policy if exists "Users can create own ingest keys" on public.user_ingest_keys;
drop policy if exists "Users can update own ingest keys" on public.user_ingest_keys;
drop policy if exists "Users can delete own ingest keys" on public.user_ingest_keys;

create policy "Users can view own ingest keys"
  on public.user_ingest_keys
  for select
  using (user_id = auth.uid());

create policy "Users can create own ingest keys"
  on public.user_ingest_keys
  for insert
  with check (
    user_id = auth.uid()
    and revoked_at is null
  );

create policy "Users can update own ingest keys"
  on public.user_ingest_keys
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own ingest keys"
  on public.user_ingest_keys
  for delete
  using (user_id = auth.uid());
