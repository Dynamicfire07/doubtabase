import "server-only";

import { redirect } from "next/navigation";

import { getLocalAdminSession, toAppUser } from "@/lib/auth/local-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requirePageUser(redirectTo = "/login") {
  const localAdminSession = await getLocalAdminSession();
  if (localAdminSession) {
    return {
      supabase: createSupabaseAdminClient(),
      user: localAdminSession.user,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(redirectTo);
  }

  return { supabase, user: toAppUser(user) };
}
