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

type CookieWriter = {
  set: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: "lax";
      secure: boolean;
      path: string;
      maxAge: number;
    },
  ) => void;
};

function writeAuthCookies(
  store: CookieWriter,
  input: {
    audience: ConsoleAudience;
    accessToken: string;
    refreshToken: string;
  },
) {
  const secure = process.env.NODE_ENV === "production";
  const refreshName = REFRESH_BY_AUDIENCE[input.audience];
  const accessName = ACCESS_BY_AUDIENCE[input.audience];

  store.set(refreshName, input.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  store.set(accessName, input.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 30,
  });

  const otherAudience =
    input.audience === "ADMIN_CONSOLE" ? "TENANT_APP" : "ADMIN_CONSOLE";
  store.set(REFRESH_BY_AUDIENCE[otherAudience], "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  store.set(ACCESS_BY_AUDIENCE[otherAudience], "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
}

function writeClearAuthCookies(store: CookieWriter, audience: ConsoleAudience) {
  const secure = process.env.NODE_ENV === "production";
  for (const name of [
    REFRESH_BY_AUDIENCE[audience],
    ACCESS_BY_AUDIENCE[audience],
  ]) {
    store.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 0,
    });
  }
}

export function applyAuthCookies(
  response: NextResponse,
  input: {
    audience: ConsoleAudience;
    accessToken: string;
    refreshToken: string;
  },
) {
  writeAuthCookies(
    {
      set: (name, value, options) => response.cookies.set(name, value, options),
    },
    input,
  );
}

export function clearAuthCookies(
  response: NextResponse,
  audience: ConsoleAudience,
) {
  writeClearAuthCookies(
    {
      set: (name, value, options) => response.cookies.set(name, value, options),
    },
    audience,
  );
}

export async function setAuthCookiesOnStore(input: {
  audience: ConsoleAudience;
  accessToken: string;
  refreshToken: string;
}) {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  writeAuthCookies(
    {
      set: (name, value, options) => store.set(name, value, options),
    },
    input,
  );
}

export async function clearAuthCookiesOnStore(audience: ConsoleAudience) {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  writeClearAuthCookies(
    {
      set: (name, value, options) => store.set(name, value, options),
    },
    audience,
  );
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
