/** Decode JWT `exp` without verifying signature (BFF cookie freshness only). */
export function isAccessTokenUsable(token: string, skewSeconds = 5): boolean {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return false;
    const payload = JSON.parse(
      atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    if (typeof payload.exp !== "number") return false;
    return payload.exp * 1000 > Date.now() + skewSeconds * 1000;
  } catch {
    return false;
  }
}
