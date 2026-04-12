import { NextResponse } from "next/server";
export async function GET() {
  return NextResponse.json({
    url: process.env.TURSO_DATABASE_URL ?? "NOT SET",
    token_length: process.env.TURSO_AUTH_TOKEN?.length ?? 0,
  });
}