import { NextResponse } from "next/server";
import { createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "APP_PASSWORD is not configured." }, { status: 503 });
  }
  const expectedPassword = process.env.APP_PASSWORD || "321";
  const body = await request.json().catch(() => ({}));
  if (typeof body.password !== "string" || body.password !== expectedPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return response;
}