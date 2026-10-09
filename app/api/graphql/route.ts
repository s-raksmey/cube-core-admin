import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const cookieStore = await cookies();
  const token = cookieStore.get("cube_session")?.value;
  const serverUrl =
    process.env.GRAPHQL_SERVER_URL ?? "http://localhost:4000/api/graphql";

  const upstream = await fetch(serverUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
