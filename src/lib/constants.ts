export const SUPABASE_ATTACHMENTS_BUCKET = "doubts-attachments";

export const MAX_ATTACHMENTS_PER_DOUBT = 5;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
