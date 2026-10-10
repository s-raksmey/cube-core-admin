import { NextResponse } from "next/server";
import { authServerBaseUrl } from "@/lib/auth/console";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { error: "Invalid or expired activation link" },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    `${authServerBaseUrl()}/api/auth/activate/validate?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  const payload = await upstream.json();
  return NextResponse.json(payload, {
    status: upstream.status,
    headers: { "Cache-Control": "no-store" },
  });
}
