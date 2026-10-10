import { NextResponse } from "next/server";
import { ADMIN_AUDIENCE, authServerBaseUrl } from "@/lib/auth/console";
import { clearAuthCookies, readAccessToken } from "@/lib/auth/cookies";

export async function POST() {
  const accessToken = await readAccessToken(ADMIN_AUDIENCE);
  if (accessToken) {
    await fetch(`${authServerBaseUrl()}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
  }

  const res = NextResponse.json({ success: true });
  clearAuthCookies(res, ADMIN_AUDIENCE);
  return res;
}
