import { NextResponse } from "next/server";
import { print } from "graphql";
import { RefreshSessionDocument } from "@/lib/apollo/generated/graphql";
import { ADMIN_AUDIENCE, authServerBaseUrl } from "@/lib/auth/console";
import { isAccessTokenUsable } from "@/lib/auth/access-token";
import {
  applyAuthCookies,
  clearAuthCookies,
  readAccessToken,
  readRefreshToken,
} from "@/lib/auth/cookies";

type SessionTokens = {
  accessToken: string | null;
  refreshToken: string | null;
  rotated: boolean;
  refreshFailed: boolean;
};

async function resolveSessionTokens(): Promise<SessionTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    readAccessToken(ADMIN_AUDIENCE),
    readRefreshToken(ADMIN_AUDIENCE),
  ]);

  if (accessToken && isAccessTokenUsable(accessToken)) {
    return { accessToken, refreshToken, rotated: false, refreshFailed: false };
  }
  if (!refreshToken) {
    return { accessToken: null, refreshToken: null, rotated: false, refreshFailed: false };
  }

  try {
    const refreshResponse = await fetch(`${authServerBaseUrl()}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: print(RefreshSessionDocument),
        variables: { refreshToken, audience: ADMIN_AUDIENCE },
      }),
      cache: "no-store",
    });
    const json = (await refreshResponse.json()) as {
      data?: {
        refreshSession?: { accessToken?: string; refreshToken?: string };
      };
      errors?: { extensions?: { code?: string } }[];
    };
    const session = json.data?.refreshSession;
    if (
      !refreshResponse.ok ||
      !session?.accessToken ||
      !session.refreshToken
    ) {
      const expired = json.errors?.some(({ extensions }) =>
        ["UNAUTHENTICATED", "FORBIDDEN"].includes(extensions?.code ?? ""),
      );
      return {
        accessToken: null,
        refreshToken: null,
        rotated: false,
        refreshFailed: Boolean(expired),
      };
    }
    return {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      rotated: true,
      refreshFailed: false,
    };
  } catch {
    return { accessToken: null, refreshToken: null, rotated: false, refreshFailed: false };
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ errors: [{ message: "Cross-origin GraphQL request rejected" }] }, { status: 403 });
  }
  const body = await request.text();
  const session = await resolveSessionTokens();
  let upstream: Response;
  try {
    upstream = await fetch(`${authServerBaseUrl()}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {}),
      },
      body,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ errors: [{ message: "GraphQL service unavailable" }] }, { status: 502 });
  }

  const response = new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
  if (session.rotated && session.accessToken && session.refreshToken) {
    applyAuthCookies(response, {
      audience: ADMIN_AUDIENCE,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  } else if (session.refreshFailed) {
    clearAuthCookies(response, ADMIN_AUDIENCE);
  }
  return response;
}
