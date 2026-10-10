import { ADMIN_AUDIENCE } from "@/lib/auth/console";
import { authServerBaseUrl } from "@/lib/auth/console";
import { readAccessToken, readRefreshToken } from "@/lib/auth/cookies";

export async function ensureAdminAccessToken(): Promise<string | null> {
  const existing = await readAccessToken(ADMIN_AUDIENCE);
  if (existing) return existing;

  const refreshToken = await readRefreshToken(ADMIN_AUDIENCE);
  if (!refreshToken) return null;

  const response = await fetch(`${authServerBaseUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refreshToken,
      audience: ADMIN_AUDIENCE,
    }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as { accessToken?: string };
  return payload.accessToken ?? null;
}
