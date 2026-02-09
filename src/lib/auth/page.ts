import "server-only";

import { redirect } from "next/navigation";

import { isAuthorizedEmail } from "@/lib/auth/allowed-email";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requirePageUser(redirectTo = "/login") {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAuthorizedEmail(user.email)) {
    redirect(redirectTo);
  }

  return { supabase, user };
}
