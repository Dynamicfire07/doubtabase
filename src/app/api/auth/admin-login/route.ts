import { NextResponse } from "next/server";
import { z } from "zod";

import {
  applyLocalAdminSession,
  authenticateLocalAdmin,
  isLocalAdminConfigured,
} from "@/lib/auth/local-admin";

export const runtime = "nodejs";

const requestSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isLocalAdminConfigured()) {
    return NextResponse.json(
      { error: "Local admin login is not configured." },
      { status: 404 },
    );
  }

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid admin email and password." },
      { status: 400 },
    );
  }

  const result = await authenticateLocalAdmin(
    parsed.data.email,
    parsed.data.password,
  );

  if (result.error === "invalid_credentials") {
    return NextResponse.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  if (result.error === "missing_user_binding") {
    return NextResponse.json(
      {
        error:
          "Local admin login is configured, but it is not bound to a dashboard user yet. Set LOCAL_ADMIN_USER_ID in .env.local.",
      },
      { status: 503 },
    );
  }

  if (result.error || !result.session) {
    return NextResponse.json(
      { error: "Local admin login is unavailable right now." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({
    ok: true,
    user: result.session.user,
  });

  applyLocalAdminSession(response, result.session);
  return response;
}
