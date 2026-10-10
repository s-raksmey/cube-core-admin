import { NextResponse } from "next/server";
import { authServerBaseUrl } from "@/lib/auth/console";

export async function POST(request: Request) {
  const body = await request.text();
  const upstream = await fetch(`${authServerBaseUrl()}/api/auth/password-reset/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  const payload = await upstream.json();
  return NextResponse.json(payload, {
    status: upstream.status,
    headers: { "Cache-Control": "no-store" },
  });
}
