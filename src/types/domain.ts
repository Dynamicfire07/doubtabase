export type Difficulty = "easy" | "medium" | "hard";
export type RoomRole = "owner" | "member";

export type Room = {
  id: string;
  name: string;
  is_personal: boolean;
  role: RoomRole;
  owner_user_id: string;
  member_count: number;
  created_at: string;
  updated_at: string;
};

export type RoomInvite = {
  id: string;
  room_id: string;
  code?: string;
  is_revoked: boolean;
  created_at: string;
  revoked_at: string | null;
};

export type RoomMember = {
  user_id: string;
  role: RoomRole;
  created_at: string;
  is_current_user: boolean;
};

export type Doubt = {
  id: string;
  room_id: string;
  created_by_user_id: string;
  title: string;
  body_markdown: string;
  subject: string;
  subtopics: string[];
  difficulty: Difficulty;
  error_tags: string[];
  is_cleared: boolean;
  thumbnail_url_signed?: string | null;
  created_at: string;
  updated_at: string;
};

export type Attachment = {
  id: string;
  doubt_id: string;
  storage_path: string;
  public_url_signed: string | null;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type DoubtComment = {
  id: string;
  doubt_id: string;
  created_by_user_id: string;
  body: string;
  created_at: string;
  is_current_user: boolean;
};

export type DoubtListResponse = {
  items: Doubt[];
  next_cursor: string | null;
  room: {
    id: string;
    role: RoomRole;
    is_personal: boolean;
    owner_user_id: string;
    name: string;
  };
  suggestions: {
    subjects: string[];
    subtopics: string[];
    error_tags: string[];
  };
};

export type RoomsListResponse = {
  items: Room[];
  default_room_id: string | null;
};
