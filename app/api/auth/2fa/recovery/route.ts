import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_AUDIENCE } from "@/lib/auth/console";
import { applyAuthCookies } from "@/lib/auth/cookies";
import { postAuth } from "@/lib/auth/upstream";
import type { AuthUser } from "@/lib/types";

const bodySchema = z.object({
  challengeToken: z.string().min(1),
  code: z.string().trim().min(8).max(64),
});

export async function POST(request: Request) {
  const raw = await request.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recovery code" }, { status: 400 });
  }

  try {
    const payload = await postAuth<{
      status: "AUTHENTICATED";
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    }>("/api/auth/2fa/recovery", parsed.data, ADMIN_AUDIENCE);

    const res = NextResponse.json({ user: payload.user });
    applyAuthCookies(res, {
      audience: ADMIN_AUDIENCE,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 401 },
    );
  }
}
