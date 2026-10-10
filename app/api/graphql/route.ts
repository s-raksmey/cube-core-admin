import { NextResponse } from "next/server";
import {
  ADMIN_AUDIENCE,
  authServerBaseUrl,
} from "@/lib/auth/console";
import { isAccessTokenUsable } from "@/lib/auth/access-token";
import {
  applyAuthCookies,
  readAccessToken,
  readRefreshToken,
} from "@/lib/auth/cookies";

async function resolveAccessToken(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
  shouldSetCookies: boolean;
}> {
  const refreshToken = (await readRefreshToken(ADMIN_AUDIENCE)) ?? null;
  const existing = await readAccessToken(ADMIN_AUDIENCE);

  if (existing && isAccessTokenUsable(existing)) {
    return {
      accessToken: existing,
      refreshToken,
      shouldSetCookies: false,
    };
  }

  if (!refreshToken) {
    return { accessToken: null, refreshToken: null, shouldSetCookies: false };
  }

  const refreshResponse = await fetch(`${authServerBaseUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken, audience: ADMIN_AUDIENCE }),
    cache: "no-store",
  });

  if (!refreshResponse.ok) {
    return { accessToken: null, refreshToken, shouldSetCookies: false };
  }

  const payload = (await refreshResponse.json()) as { accessToken?: string };
  const accessToken = payload.accessToken ?? null;
  return {
    accessToken,
    refreshToken,
    shouldSetCookies: Boolean(accessToken),
  };
}

export async function POST(request: Request) {
  const body = await request.text();
  const { accessToken, refreshToken, shouldSetCookies } =
    await resolveAccessToken();
  const serverUrl =
    process.env.GRAPHQL_SERVER_URL ?? "http://localhost:4000/api/graphql";

  const upstream = await fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body,
  });

  const text = await upstream.text();
  const response = new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });

  if (shouldSetCookies && accessToken && refreshToken) {
    applyAuthCookies(response, {
      audience: ADMIN_AUDIENCE,
      accessToken,
      refreshToken,
    });
  }

  return response;
}
