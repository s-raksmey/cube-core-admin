"use server";

import { ADMIN_AUDIENCE, authServerBaseUrl } from "@/lib/auth/console";
import { isAccessTokenUsable } from "@/lib/auth/access-token";
import {
  clearAuthCookiesOnStore,
  readAccessToken,
  readRefreshToken,
  setAuthCookiesOnStore,
} from "@/lib/auth/cookies";

/** Persist HttpOnly session cookies after a GraphQL AuthPayload. */
export async function establishAdminSession(input: {
  accessToken: string;
  refreshToken: string;
}) {
  await setAuthCookiesOnStore({
    audience: ADMIN_AUDIENCE,
    accessToken: input.accessToken,
    refreshToken: input.refreshToken,
  });
}

export async function clearAdminSession() {
  await clearAuthCookiesOnStore(ADMIN_AUDIENCE);
}

/**
 * Refresh the short-lived access cookie when needed so rewritten `/graphql`
 * requests can send a usable Cookie header to the server.
 */
export async function ensureAdminSession(): Promise<{ ok: boolean }> {
  const existing = await readAccessToken(ADMIN_AUDIENCE);
  if (existing && isAccessTokenUsable(existing)) {
    return { ok: true };
  }

  const refreshToken = await readRefreshToken(ADMIN_AUDIENCE);
  if (!refreshToken) {
    return { ok: false };
  }

  const refreshResponse = await fetch(`${authServerBaseUrl()}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation RefreshSession($refreshToken: String!, $audience: LoginAudience!) {
        refreshSession(refreshToken: $refreshToken, audience: $audience) {
          accessToken
        }
      }`,
      variables: { refreshToken, audience: ADMIN_AUDIENCE },
    }),
    cache: "no-store",
  });

  const json = (await refreshResponse.json()) as {
    data?: { refreshSession?: { accessToken?: string } };
    errors?: unknown[];
  };

  const accessToken = json.data?.refreshSession?.accessToken;
  if (!refreshResponse.ok || json.errors?.length || !accessToken) {
    await clearAuthCookiesOnStore(ADMIN_AUDIENCE);
    return { ok: false };
  }

  await setAuthCookiesOnStore({
    audience: ADMIN_AUDIENCE,
    accessToken,
    refreshToken,
  });
  return { ok: true };
}
