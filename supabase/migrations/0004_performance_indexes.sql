-- Performance indexes for room-scoped listing and metadata lookups.

create index if not exists doubts_room_updated_at_idx
  on public.doubts (room_id, updated_at desc, id desc);

create index if not exists doubt_attachments_doubt_created_desc_idx
  on public.doubt_attachments (doubt_id, created_at desc);

create index if not exists room_members_user_room_idx
  on public.room_members (user_id, room_id);
