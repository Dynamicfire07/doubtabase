create extension if not exists pgcrypto;

create table if not exists public.doubt_comments (
  id uuid primary key default gen_random_uuid(),
  doubt_id uuid not null references public.doubts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists doubt_comments_doubt_created_idx
  on public.doubt_comments (doubt_id, created_at asc, id asc);

create index if not exists doubt_comments_user_id_idx
  on public.doubt_comments (user_id);

alter table public.doubt_comments enable row level security;

drop policy if exists "Room members can select comments" on public.doubt_comments;
drop policy if exists "Room members can insert comments" on public.doubt_comments;
drop policy if exists "Owners or authors can delete comments" on public.doubt_comments;

create policy "Room members can select comments"
  on public.doubt_comments
  for select
  using (
    exists (
      select 1
      from public.doubts d
      where d.id = doubt_id
        and public.is_room_member(d.room_id, auth.uid())
    )
  );

create policy "Room members can insert comments"
  on public.doubt_comments
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.doubts d
      where d.id = doubt_id
        and public.is_room_member(d.room_id, auth.uid())
    )
  );

create policy "Owners or authors can delete comments"
  on public.doubt_comments
  for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.doubts d
      where d.id = doubt_id
        and public.is_room_owner(d.room_id, auth.uid())
    )
  );
