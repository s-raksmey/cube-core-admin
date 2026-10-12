import { createHash } from "node:crypto";
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

const refreshesInFlight = new Map<string, Promise<SessionTokens>>();
// Branding images are capped at 1,000 KB by the API. GraphQL carries them as
// Base64, which adds roughly one third to the request size.
const MAX_GRAPHQL_BODY_BYTES = 1_500_000;

function refreshKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function refreshSession(refreshToken: string): Promise<SessionTokens> {
  try {
    const refreshResponse = await fetch(`${authServerBaseUrl()}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cube-auth-action-secret": process.env.ADMIN_AUTH_ACTION_SECRET ?? "",
      },
      body: JSON.stringify({
        query: print(RefreshSessionDocument),
        variables: { refreshToken, audience: ADMIN_AUDIENCE },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await refreshResponse.json()) as {
      data?: {
        refreshSession?: { accessToken?: string; refreshToken?: string };
      };
      errors?: { extensions?: { code?: string } }[];
    };
    const session = json.data?.refreshSession;
    if (
      refreshResponse.ok &&
      session?.accessToken &&
      session.refreshToken
    ) {
      return {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        rotated: true,
        refreshFailed: false,
      };
    }

    const terminalFailure = json.errors?.some(({ extensions }) =>
      ["UNAUTHENTICATED", "FORBIDDEN"].includes(extensions?.code ?? ""),
    );
    return {
      accessToken: null,
      refreshToken: null,
      rotated: false,
      refreshFailed: Boolean(terminalFailure),
    };
  } catch {
    // Preserve cookies for transient upstream failures so a later request can retry.
    return {
      accessToken: null,
      refreshToken: null,
      rotated: false,
      refreshFailed: false,
    };
  }
}

function refreshSessionOnce(refreshToken: string) {
  // Coalesce overlapping requests handled by this Next.js worker.
  const key = refreshKey(refreshToken);
  const existing = refreshesInFlight.get(key);
  if (existing) return existing;

  const pending = refreshSession(refreshToken).finally(() => {
    refreshesInFlight.delete(key);
  });
  refreshesInFlight.set(key, pending);
  return pending;
}

async function resolveSessionTokens(): Promise<SessionTokens> {
  const [accessToken, refreshToken] = await Promise.all([
    readAccessToken(ADMIN_AUDIENCE),
    readRefreshToken(ADMIN_AUDIENCE),
  ]);

  if (accessToken && isAccessTokenUsable(accessToken)) {
    return { accessToken, refreshToken, rotated: false, refreshFailed: false };
  }
  if (!refreshToken) {
    return {
      accessToken: null,
      refreshToken: null,
      rotated: false,
      refreshFailed: Boolean(accessToken),
    };
  }

  return refreshSessionOnce(refreshToken);
}

function graphQLError(message: string, status: number) {
  return NextResponse.json({ errors: [{ message }] }, { status });
}

function hasUnauthenticatedError(body: string, requestBody: string) {
  try {
    const payload = JSON.parse(body) as {
      errors?: { extensions?: { code?: string } }[];
    };
    const request = JSON.parse(requestBody) as {
      operationName?: string;
      query?: string;
    };
    const isCurrentUserCheck =
      request.operationName === "CurrentUser" ||
      /\bquery\s+CurrentUser\b/.test(request.query ?? "");

    return isCurrentUserCheck && (payload.errors?.some(
      (error) => error.extensions?.code === "UNAUTHENTICATED",
    ) ?? false);
  } catch {
    return false;
  }
}

async function readBodyWithinLimit(request: Request): Promise<string | null> {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_GRAPHQL_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (
    (origin && origin !== requestUrl.origin) ||
    fetchSite === "cross-site"
  ) {
    return graphQLError("Cross-origin GraphQL request rejected", 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return graphQLError("GraphQL requests must use application/json", 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_GRAPHQL_BODY_BYTES) {
    return graphQLError("GraphQL request is too large", 413);
  }

  const body = await readBodyWithinLimit(request);
  if (body === null) {
    return graphQLError("GraphQL request is too large", 413);
  }

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
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return graphQLError("GraphQL service unavailable", 502);
  }

  const responseBody = await upstream.text();
  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });

  if (session.rotated && session.accessToken && session.refreshToken) {
    applyAuthCookies(response, {
      audience: ADMIN_AUDIENCE,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  } else if (
    session.refreshFailed ||
    hasUnauthenticatedError(responseBody, body)
  ) {
    clearAuthCookies(response, ADMIN_AUDIENCE);
  }

  return response;
}
