import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_AUDIENCE } from "@/lib/auth/console";
import { applyAuthCookies } from "@/lib/auth/cookies";
import { postAuth } from "@/lib/auth/upstream";
import type { AuthUser } from "@/lib/types";

const loginBodySchema = z.object({
  /** Username or email. */
  email: z.string().trim().min(1).max(254),
  password: z.string().min(1),
});

type LoginResponse =
  | {
      status: "CHALLENGE";
      nextStep: "TOTP_ENROLL" | "TOTP_VERIFY";
      challengeToken: string;
      qrCodeDataUrl?: string;
    }
  | {
      status: "AUTHENTICATED";
      accessToken: string;
      refreshToken: string;
      audience: typeof ADMIN_AUDIENCE;
      user: AuthUser;
    };

export async function POST(request: Request) {
  const raw = await request.json();
  const parsed = loginBodySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valid username/email and password are required" },
      { status: 400 },
    );
  }

  try {
    const payload = await postAuth<LoginResponse>(
      "/api/auth/login",
      parsed.data,
      ADMIN_AUDIENCE,
    );

    if (payload.status === "CHALLENGE") {
      return NextResponse.json(payload);
    }

    const res = NextResponse.json({ user: payload.user });
    applyAuthCookies(res, {
      audience: ADMIN_AUDIENCE,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed" },
      { status: 401 },
    );
  }
}
