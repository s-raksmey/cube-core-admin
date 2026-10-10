import {
  ADMIN_AUDIENCE,
  authServerBaseUrl,
  type ConsoleAudience,
} from "@/lib/auth/console";

export async function postAuth<T>(
  path: string,
  body: Record<string, unknown>,
  audience: ConsoleAudience = ADMIN_AUDIENCE,
): Promise<T> {
  const response = await fetch(`${authServerBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, audience }),
    cache: "no-store",
  });
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Authentication request failed");
  }
  return payload;
}
