import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

// GET /api/game?code=XXXXX
export async function GET(req: NextRequest) {
  try {
    await initDb();
    const code = req.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

    const db = getDb();
    const result = await db.execute({
      sql: "SELECT state FROM game_state WHERE room_code = ?",
      args: [code.toUpperCase()],
    });

    if (result.rows.length === 0) return NextResponse.json(null);
    return NextResponse.json(JSON.parse(result.rows[0].state as string));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/game
// Body: { code: string, state: object }
export async function POST(req: NextRequest) {
  try {
    await initDb();
    const { code, state } = await req.json();
    if (!code || !state) return NextResponse.json({ error: "Missing code or state" }, { status: 400 });

    const db = getDb();
    await db.execute({
      sql: `INSERT INTO game_state (room_code, state, updated_at)
            VALUES (?, ?, unixepoch())
            ON CONFLICT(room_code) DO UPDATE SET state = excluded.state, updated_at = unixepoch()`,
      args: [code.toUpperCase(), JSON.stringify(state)],
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
