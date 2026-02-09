export type Difficulty = "easy" | "medium" | "hard";

export type Doubt = {
  id: string;
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

export type DoubtListResponse = {
  items: Doubt[];
  next_cursor: string | null;
  suggestions: {
    subjects: string[];
    subtopics: string[];
    error_tags: string[];
  };
};
