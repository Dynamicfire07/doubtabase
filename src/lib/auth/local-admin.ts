import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { hasSupabaseServiceEnv, serverEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const LOCAL_ADMIN_COOKIE_NAME = "doubts_local_admin.v1";
const LOCAL_ADMIN_TTL_SECONDS = 60 * 60 * 24 * 14;

export type AppUser = {
  id: string;
  email: string | null;
  is_local_admin?: boolean;
  user_metadata: {
    full_name?: string;
  };
};

type LocalAdminTokenPayload = {
  userId: string;
  email: string;
  exp: number;
};

type LocalAdminSession = {
  user: AppUser;
  expiresAt: number;
};

function normalizeOptionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getCookieSecret() {
  return normalizeOptionalString(serverEnv.LOCAL_ADMIN_COOKIE_SECRET);
}

export function isLocalAdminConfigured() {
  return Boolean(
    normalizeOptionalString(serverEnv.LOCAL_ADMIN_EMAIL) &&
      normalizeOptionalString(serverEnv.LOCAL_ADMIN_PASSWORD) &&
      getCookieSecret(),
  );
}

export function toAppUser(
  user: Pick<User, "id" | "email" | "user_metadata">,
): AppUser {
  return {
    id: user.id,
    email: user.email ?? null,
    user_metadata:
      typeof user === "object" &&
      user &&
      "user_metadata" in user &&
      typeof user.user_metadata === "object" &&
      user.user_metadata !== null
        ? {
            full_name:
              typeof user.user_metadata.full_name === "string"
                ? user.user_metadata.full_name
                : undefined,
          }
        : {},
  };
}

function signPayload(payload: string) {
  const secret = getCookieSecret();
  if (!secret) {
    throw new Error("Missing LOCAL_ADMIN_COOKIE_SECRET");
  }

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeLocalAdminToken(payload: LocalAdminTokenPayload) {
  const serializedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(serializedPayload);
  return `${serializedPayload}.${signature}`;
}

function decodeLocalAdminToken(token: string | undefined): LocalAdminSession | null {
  if (!token) {
    return null;
  }

  const [serializedPayload, signature] = token.split(".", 2);
  if (!serializedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(serializedPayload);
  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(serializedPayload, "base64url").toString("utf8"),
    ) as LocalAdminTokenPayload;

    if (!parsed.userId || !parsed.email || !parsed.exp) {
      return null;
    }

    if (parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      user: {
        id: parsed.userId,
        email: parsed.email,
        is_local_admin: true,
        user_metadata: {
          full_name: "Local Admin",
        },
      },
      expiresAt: parsed.exp,
    };
  } catch {
    return null;
  }
}

async function resolveBootstrapUserId(email: string) {
  if (normalizeOptionalString(serverEnv.LOCAL_ADMIN_USER_ID)) {
    return serverEnv.LOCAL_ADMIN_USER_ID;
  }

  if (!hasSupabaseServiceEnv()) {
    return null;
  }

  const admin = createSupabaseAdminClient();

  try {
    const {
      data: { users },
    } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    const matchedUser = users.find(
      (user) => user.email?.trim().toLowerCase() === email.toLowerCase(),
    );

    if (matchedUser?.id) {
      return matchedUser.id;
    }
  } catch {
    // Fall through to database bootstrap user discovery.
  }

  const { data: ownerRoom } = await admin
    .from("rooms")
    .select("owner_user_id")
    .limit(1)
    .maybeSingle();

  if (ownerRoom?.owner_user_id) {
    return ownerRoom.owner_user_id;
  }

  const { data: roomMember } = await admin
    .from("room_members")
    .select("user_id")
    .limit(1)
    .maybeSingle();

  return roomMember?.user_id ?? null;
}

export async function getLocalAdminSession() {
  if (!isLocalAdminConfigured()) {
    return null;
  }

  const cookieStore = await cookies();
  return decodeLocalAdminToken(cookieStore.get(LOCAL_ADMIN_COOKIE_NAME)?.value);
}

export function applyLocalAdminSession(
  response: NextResponse,
  session: LocalAdminSession,
) {
  response.cookies.set(
    LOCAL_ADMIN_COOKIE_NAME,
    encodeLocalAdminToken({
      userId: session.user.id,
      email: session.user.email ?? "",
      exp: session.expiresAt,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: LOCAL_ADMIN_TTL_SECONDS,
    },
  );
}

export function clearLocalAdminSession(response: NextResponse) {
  response.cookies.set(LOCAL_ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function authenticateLocalAdmin(email: string, password: string) {
  const configuredEmail = normalizeOptionalString(serverEnv.LOCAL_ADMIN_EMAIL);
  const configuredPassword = normalizeOptionalString(serverEnv.LOCAL_ADMIN_PASSWORD);

  if (!configuredEmail || !configuredPassword || !isLocalAdminConfigured()) {
    return {
      session: null,
      error: "not_configured" as const,
    };
  }

  if (
    configuredEmail.toLowerCase() !== email.trim().toLowerCase() ||
    !safeCompare(password, configuredPassword)
  ) {
    return {
      session: null,
      error: "invalid_credentials" as const,
    };
  }

  const userId = await resolveBootstrapUserId(configuredEmail);
  if (!userId) {
    return {
      session: null,
      error: "missing_user_binding" as const,
    };
  }

  return {
    session: {
      user: {
        id: userId,
        email: configuredEmail,
        is_local_admin: true,
        user_metadata: {
          full_name: "Local Admin",
        },
      },
      expiresAt: Math.floor(Date.now() / 1000) + LOCAL_ADMIN_TTL_SECONDS,
    },
    error: null,
  };
}
