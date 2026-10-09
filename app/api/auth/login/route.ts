import { NextResponse } from "next/server";

const SESSION_COOKIE = "cube_session";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const serverUrl =
    process.env.GRAPHQL_SERVER_URL ?? "http://localhost:4000/api/graphql";

  const response = await fetch(serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        mutation Login(
          $email: String!
          $password: String!
          $audience: LoginAudience
        ) {
          login(email: $email, password: $password, audience: $audience) {
            token
            user {
              id
              email
              role
              tenantId
              tenant {
                id
                name
                slug
                type
                status
              }
            }
          }
        }
      `,
      variables: {
        email: body.email ?? "",
        password: body.password ?? "",
        audience: "ADMIN_CONSOLE",
      },
    }),
  });

  const payload = (await response.json()) as {
    data?: { login?: { token: string; user: unknown } };
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length || !payload.data?.login) {
    return NextResponse.json(
      { error: payload.errors?.[0]?.message ?? "Login failed" },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ user: payload.data.login.user });
  res.cookies.set(SESSION_COOKIE, payload.data.login.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
