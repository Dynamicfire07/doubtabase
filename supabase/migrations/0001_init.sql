create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'difficulty_enum'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.difficulty_enum as enum ('easy', 'medium', 'hard');
  end if;
end
$$;

create table public.doubts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body_markdown text not null,
  subject text not null,
  subtopics text[] not null default '{}',
  difficulty public.difficulty_enum not null,
  error_tags text[] not null default '{}',
  is_cleared boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  search_vector tsvector not null default ''::tsvector
);

create table public.doubt_attachments (
  id uuid primary key default gen_random_uuid(),
  doubt_id uuid not null references public.doubts(id) on delete cascade,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index doubts_user_created_at_idx on public.doubts (user_id, created_at desc);
create index doubts_user_is_cleared_idx on public.doubts (user_id, is_cleared);
create index doubts_user_difficulty_idx on public.doubts (user_id, difficulty);
create index doubts_user_subject_idx on public.doubts (user_id, subject);
create index doubts_subtopics_gin_idx on public.doubts using gin (subtopics);
create index doubts_error_tags_gin_idx on public.doubts using gin (error_tags);
create index doubts_search_vector_gin_idx on public.doubts using gin (search_vector);
create index doubt_attachments_doubt_id_idx on public.doubt_attachments (doubt_id);

create function public.update_doubts_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.body_markdown, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.subject, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(coalesce(new.subtopics, array[]::text[]), ' ')), 'C') ||
    setweight(to_tsvector('english', array_to_string(coalesce(new.error_tags, array[]::text[]), ' ')), 'C');

  return new;
end;
$$;

create trigger update_doubts_search_vector_trigger
before insert or update of title, body_markdown, subject, subtopics, error_tags
on public.doubts
for each row execute function public.update_doubts_search_vector();

create function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger update_doubts_updated_at
before update on public.doubts
for each row execute function public.set_current_timestamp_updated_at();

alter table public.doubts enable row level security;
alter table public.doubt_attachments enable row level security;

create policy "Users can select own doubts"
  on public.doubts
  for select
  using (auth.uid() = user_id);

create policy "Users can insert own doubts"
  on public.doubts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update own doubts"
  on public.doubts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own doubts"
  on public.doubts
  for delete
  using (auth.uid() = user_id);

create policy "Users can read own attachments"
  on public.doubt_attachments
  for select
  using (
    exists (
      select 1
      from public.doubts d
      where d.id = doubt_id
        and d.user_id = auth.uid()
    )
  );

create policy "Users can insert attachments for own doubts"
  on public.doubt_attachments
  for insert
  with check (
    exists (
      select 1
      from public.doubts d
      where d.id = doubt_id
        and d.user_id = auth.uid()
    )
  );

create policy "Users can delete own attachments"
  on public.doubt_attachments
  for delete
  using (
    exists (
      select 1
      from public.doubts d
      where d.id = doubt_id
        and d.user_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'doubts-attachments',
  'doubts-attachments',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload own doubt attachments" on storage.objects;
drop policy if exists "Users can update own doubt attachments" on storage.objects;
drop policy if exists "Users can delete own doubt attachments" on storage.objects;
drop policy if exists "Users can read own doubt attachments" on storage.objects;

create policy "Users can upload own doubt attachments"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'doubts-attachments'
    and (storage.foldername(name))[1] = 'doubts'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users can update own doubt attachments"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'doubts-attachments'
    and (storage.foldername(name))[1] = 'doubts'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = 'doubts-attachments'
    and (storage.foldername(name))[1] = 'doubts'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users can delete own doubt attachments"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'doubts-attachments'
    and (storage.foldername(name))[1] = 'doubts'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users can read own doubt attachments"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'doubts-attachments'
    and (storage.foldername(name))[1] = 'doubts'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
