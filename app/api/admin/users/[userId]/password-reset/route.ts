import { NextResponse } from "next/server";
import { ADMIN_AUDIENCE, authServerBaseUrl } from "@/lib/auth/console";
import { readAccessToken } from "@/lib/auth/cookies";
import { ensureAdminAccessToken } from "@/lib/auth/ensure-access-token";

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const accessToken = (await ensureAdminAccessToken()) ?? (await readAccessToken(ADMIN_AUDIENCE));
  if (!accessToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { userId } = await context.params;
  const upstream = await fetch(
    `${authServerBaseUrl()}/api/admin/users/${encodeURIComponent(userId)}/password-reset`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );
  const payload = await upstream.json();
  return NextResponse.json(payload, {
    status: upstream.status,
    headers: { "Cache-Control": "no-store" },
  });
}
