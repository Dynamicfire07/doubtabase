import { publicEnv } from "@/lib/env/public";

export function isAuthorizedEmail(email: string | null | undefined) {
  const allowed = publicEnv.NEXT_PUBLIC_ALLOWED_EMAIL?.toLowerCase();

  if (!allowed) {
    return true;
  }

  return email?.toLowerCase() === allowed;
}
