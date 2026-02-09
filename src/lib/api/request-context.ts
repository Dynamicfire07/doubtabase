import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { isAuthorizedEmail } from "@/lib/auth/allowed-email";
import { logWarn } from "@/lib/logger";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserContext = {
  supabase: SupabaseClient<Database>;
  user: User;
};

type UserContextResult =
  | { context: UserContext; error: null }
  | { context: null; error: NextResponse };

export async function requireUserContext(): Promise<UserContextResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      context: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAuthorizedEmail(user.email)) {
    logWarn("auth.forbidden_email", { email: user.email });

    return {
      context: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    context: {
      supabase,
      user,
    },
    error: null,
  };
}
