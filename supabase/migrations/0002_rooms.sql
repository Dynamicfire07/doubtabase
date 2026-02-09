create extension if not exists pgcrypto;

-- Rooms roles for collaborative workspaces.
do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'room_role_enum'
      and typnamespace = 'public'::regnamespace
  ) then
    create type public.room_role_enum as enum ('owner', 'member');
  end if;
end
$$;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  is_personal boolean not null default false,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists rooms_personal_owner_unique_idx
  on public.rooms (owner_user_id)
  where is_personal = true;

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.room_role_enum not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (room_id, user_id)
);

create index if not exists room_members_user_id_idx
  on public.room_members (user_id);
create index if not exists room_members_room_role_idx
  on public.room_members (room_id, role);

create table if not exists public.room_invites (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  token_hash text not null unique,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  revoked_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists room_invites_room_id_idx
  on public.room_invites (room_id);

create unique index if not exists room_invites_one_active_per_room_idx
  on public.room_invites (room_id)
  where revoked_at is null;

-- Stable helper predicates used by RLS and storage policies.
create or replace function public.is_room_member(target_room_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.user_id = target_user_id
  );
$$;

create or replace function public.is_room_owner(target_room_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = target_room_id
      and rm.user_id = target_user_id
      and rm.role = 'owner'
  );
$$;

-- Keep immutable ownership metadata for doubts.
create or replace function public.prevent_doubt_scope_change()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'Changing doubt creator is not allowed';
  end if;

  -- Allow one-time NULL -> value assignment during migration backfill.
  if old.room_id is not null and new.room_id is distinct from old.room_id then
    raise exception 'Changing doubt room is not allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_doubt_scope_change_trigger on public.doubts;
create trigger prevent_doubt_scope_change_trigger
before update on public.doubts
for each row execute function public.prevent_doubt_scope_change();

-- Add room linkage to doubts and backfill to personal workspaces.
alter table public.doubts
  add column if not exists room_id uuid references public.rooms(id) on delete cascade;

insert into public.rooms (name, is_personal, owner_user_id)
select 'Personal', true, u.id
from auth.users u
where not exists (
  select 1
  from public.rooms r
  where r.owner_user_id = u.id
    and r.is_personal = true
);

insert into public.room_members (room_id, user_id, role)
select r.id, r.owner_user_id, 'owner'::public.room_role_enum
from public.rooms r
where r.is_personal = true
on conflict (room_id, user_id) do update
set role = 'owner';

update public.doubts d
set room_id = r.id
from public.rooms r
where d.room_id is null
  and r.owner_user_id = d.user_id
  and r.is_personal = true;

alter table public.doubts
  alter column room_id set not null;

-- Keep rooms updated_at aligned with doubts behavior.
drop trigger if exists update_rooms_updated_at on public.rooms;
create trigger update_rooms_updated_at
before update on public.rooms
for each row execute function public.set_current_timestamp_updated_at();

-- Auto-provision personal room for new users.
create or replace function public.handle_auth_user_created_personal_room()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  personal_room_id uuid;
begin
  insert into public.rooms (name, is_personal, owner_user_id)
  values ('Personal', true, new.id)
  on conflict do nothing
  returning id into personal_room_id;

  if personal_room_id is null then
    select r.id
    into personal_room_id
    from public.rooms r
    where r.owner_user_id = new.id
      and r.is_personal = true
    limit 1;
  end if;

  if personal_room_id is not null then
    insert into public.room_members (room_id, user_id, role)
    values (personal_room_id, new.id, 'owner')
    on conflict (room_id, user_id) do update
    set role = 'owner';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_personal_room on auth.users;
create trigger on_auth_user_created_personal_room
after insert on auth.users
for each row execute function public.handle_auth_user_created_personal_room();

-- Re-scope doubts indexes to room-based access patterns.
drop index if exists public.doubts_user_created_at_idx;
drop index if exists public.doubts_user_is_cleared_idx;
drop index if exists public.doubts_user_difficulty_idx;
drop index if exists public.doubts_user_subject_idx;

create index if not exists doubts_room_created_at_idx
  on public.doubts (room_id, created_at desc, id desc);
create index if not exists doubts_room_is_cleared_idx
  on public.doubts (room_id, is_cleared);
create index if not exists doubts_room_difficulty_idx
  on public.doubts (room_id, difficulty);
create index if not exists doubts_room_subject_idx
  on public.doubts (room_id, subject);

-- RLS: room-scoped collaboration rules.
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_invites enable row level security;
alter table public.doubts enable row level security;
alter table public.doubt_attachments enable row level security;

drop policy if exists "Users can select own doubts" on public.doubts;
drop policy if exists "Users can insert own doubts" on public.doubts;
drop policy if exists "Users can update own doubts" on public.doubts;
drop policy if exists "Users can delete own doubts" on public.doubts;

drop policy if exists "Users can read own attachments" on public.doubt_attachments;
drop policy if exists "Users can insert attachments for own doubts" on public.doubt_attachments;
drop policy if exists "Users can delete own attachments" on public.doubt_attachments;

drop policy if exists "Room members can view rooms" on public.rooms;
drop policy if exists "Users can create shared rooms" on public.rooms;
drop policy if exists "Owners can update shared rooms" on public.rooms;
drop policy if exists "Owners can delete shared rooms" on public.rooms;

drop policy if exists "Room members can view room members" on public.room_members;
drop policy if exists "Owners can add room members" on public.room_members;
drop policy if exists "Owners can remove room members" on public.room_members;

drop policy if exists "Owners can view room invites" on public.room_invites;
drop policy if exists "Owners can create room invites" on public.room_invites;
drop policy if exists "Owners can update room invites" on public.room_invites;
drop policy if exists "Owners can delete room invites" on public.room_invites;

create policy "Room members can view rooms"
  on public.rooms
  for select
  using (
    public.is_room_member(id, auth.uid())
    or owner_user_id = auth.uid()
  );

create policy "Users can create shared rooms"
  on public.rooms
  for insert
  with check (
    owner_user_id = auth.uid()
    and is_personal = false
  );

create policy "Owners can update shared rooms"
  on public.rooms
  for update
  using (
    owner_user_id = auth.uid()
    and is_personal = false
  )
  with check (
    owner_user_id = auth.uid()
    and is_personal = false
  );

create policy "Owners can delete shared rooms"
  on public.rooms
  for delete
  using (
    owner_user_id = auth.uid()
    and is_personal = false
  );

create policy "Room members can view room members"
  on public.room_members
  for select
  using (public.is_room_member(room_id, auth.uid()));

create policy "Owners can add room members"
  on public.room_members
  for insert
  with check (
    exists (
      select 1
      from public.rooms r
      where r.id = room_id
        and r.owner_user_id = auth.uid()
        and r.is_personal = false
    )
    and (
      role = 'member'
      or (role = 'owner' and user_id = auth.uid())
    )
  );

create policy "Owners can remove room members"
  on public.room_members
  for delete
  using (
    exists (
      select 1
      from public.rooms r
      where r.id = room_id
        and r.owner_user_id = auth.uid()
        and r.is_personal = false
    )
    and role = 'member'
  );

create policy "Owners can view room invites"
  on public.room_invites
  for select
  using (public.is_room_owner(room_id, auth.uid()));

create policy "Owners can create room invites"
  on public.room_invites
  for insert
  with check (
    public.is_room_owner(room_id, auth.uid())
    and created_by_user_id = auth.uid()
  );

create policy "Owners can update room invites"
  on public.room_invites
  for update
  using (public.is_room_owner(room_id, auth.uid()))
  with check (public.is_room_owner(room_id, auth.uid()));

create policy "Owners can delete room invites"
  on public.room_invites
  for delete
  using (public.is_room_owner(room_id, auth.uid()));

create policy "Room members can select doubts"
  on public.doubts
  for select
  using (public.is_room_member(room_id, auth.uid()));

create policy "Room members can insert doubts"
  on public.doubts
  for insert
  with check (
    public.is_room_member(room_id, auth.uid())
    and user_id = auth.uid()
  );

create policy "Room members can update doubts"
  on public.doubts
  for update
  using (public.is_room_member(room_id, auth.uid()))
  with check (public.is_room_member(room_id, auth.uid()));

create policy "Room owners can delete doubts"
  on public.doubts
  for delete
  using (public.is_room_owner(room_id, auth.uid()));

create policy "Room members can read attachments"
  on public.doubt_attachments
  for select
  using (
    exists (
      select 1
      from public.doubts d
      where d.id = doubt_id
        and public.is_room_member(d.room_id, auth.uid())
    )
  );

create policy "Room members can insert attachments"
  on public.doubt_attachments
  for insert
  with check (
    exists (
      select 1
      from public.doubts d
      where d.id = doubt_id
        and public.is_room_member(d.room_id, auth.uid())
    )
  );

create policy "Room owners can delete attachments"
  on public.doubt_attachments
  for delete
  using (
    exists (
      select 1
      from public.doubts d
      where d.id = doubt_id
        and public.is_room_owner(d.room_id, auth.uid())
    )
  );

-- Storage policies for room-scoped uploads and legacy reads.
drop policy if exists "Users can upload own doubt attachments" on storage.objects;
drop policy if exists "Users can update own doubt attachments" on storage.objects;
drop policy if exists "Users can delete own doubt attachments" on storage.objects;
drop policy if exists "Users can read own doubt attachments" on storage.objects;
drop policy if exists "Room members can upload room attachments" on storage.objects;
drop policy if exists "Room members can update room attachments" on storage.objects;
drop policy if exists "Room owners can delete room attachments" on storage.objects;
drop policy if exists "Room members can read room attachments" on storage.objects;

create policy "Room members can upload room attachments"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'doubts-attachments'
    and (storage.foldername(name))[1] = 'rooms'
    and (storage.foldername(name))[2] ~* '^[0-9a-f-]{36}$'
    and public.is_room_member(((storage.foldername(name))[2])::uuid, auth.uid())
  );

create policy "Room members can update room attachments"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'doubts-attachments'
    and (storage.foldername(name))[1] = 'rooms'
    and (storage.foldername(name))[2] ~* '^[0-9a-f-]{36}$'
    and public.is_room_member(((storage.foldername(name))[2])::uuid, auth.uid())
  )
  with check (
    bucket_id = 'doubts-attachments'
    and (storage.foldername(name))[1] = 'rooms'
    and (storage.foldername(name))[2] ~* '^[0-9a-f-]{36}$'
    and public.is_room_member(((storage.foldername(name))[2])::uuid, auth.uid())
  );

create policy "Room owners can delete room attachments"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'doubts-attachments'
    and (storage.foldername(name))[1] = 'rooms'
    and (storage.foldername(name))[2] ~* '^[0-9a-f-]{36}$'
    and public.is_room_owner(((storage.foldername(name))[2])::uuid, auth.uid())
  );

create policy "Room members can read room attachments"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'doubts-attachments'
    and (
      (
        (storage.foldername(name))[1] = 'rooms'
        and (storage.foldername(name))[2] ~* '^[0-9a-f-]{36}$'
        and public.is_room_member(((storage.foldername(name))[2])::uuid, auth.uid())
      )
      or (
        -- Temporary compatibility for legacy personal paths: doubts/{user_id}/{doubt_id}/...
        (storage.foldername(name))[1] = 'doubts'
        and (storage.foldername(name))[2] = auth.uid()::text
      )
    )
  );
