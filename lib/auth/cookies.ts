import { NextResponse } from "next/server";
import type { ConsoleAudience } from "@/lib/auth/console";

const REFRESH_BY_AUDIENCE: Record<ConsoleAudience, string> = {
  ADMIN_CONSOLE: "management_console_admin_session",
  TENANT_APP: "management_console_tenant_session",
};

const ACCESS_BY_AUDIENCE: Record<ConsoleAudience, string> = {
  ADMIN_CONSOLE: "management_console_admin_access",
  TENANT_APP: "management_console_tenant_access",
};

export function applyAuthCookies(
  response: NextResponse,
  input: {
    audience: ConsoleAudience;
    accessToken: string;
    refreshToken: string;
  },
) {
  const secure = process.env.NODE_ENV === "production";
  const refreshName = REFRESH_BY_AUDIENCE[input.audience];
  const accessName = ACCESS_BY_AUDIENCE[input.audience];

  response.cookies.set(refreshName, input.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.set(accessName, input.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 30,
  });

  const otherAudience =
    input.audience === "ADMIN_CONSOLE" ? "TENANT_APP" : "ADMIN_CONSOLE";
  response.cookies.set(REFRESH_BY_AUDIENCE[otherAudience], "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(ACCESS_BY_AUDIENCE[otherAudience], "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export function clearAuthCookies(response: NextResponse, audience: ConsoleAudience) {
  const secure = process.env.NODE_ENV === "production";
  for (const name of [
    REFRESH_BY_AUDIENCE[audience],
    ACCESS_BY_AUDIENCE[audience],
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 0,
    });
  }
}

export async function readAccessToken(audience: ConsoleAudience) {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return store.get(ACCESS_BY_AUDIENCE[audience])?.value ?? null;
}

export async function readRefreshToken(audience: ConsoleAudience) {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  return store.get(REFRESH_BY_AUDIENCE[audience])?.value ?? null;
}
