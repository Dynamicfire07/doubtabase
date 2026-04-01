import { NextResponse } from "next/server";

import { getLocalAdminSession, isLocalAdminConfigured } from "@/lib/auth/local-admin";

export const runtime = "nodejs";

export async function GET() {
  const session = await getLocalAdminSession();

  return NextResponse.json(
    {
      configured: isLocalAdminConfigured(),
      authenticated: Boolean(session),
      user: session?.user ?? null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
