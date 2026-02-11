import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/dashboard";
  }

  return nextPath;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const providerError = requestUrl.searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(new URL("/login?error=oauth_provider", origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_callback", origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_callback", origin));
  }

  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  return NextResponse.redirect(new URL(nextPath, origin));
}
