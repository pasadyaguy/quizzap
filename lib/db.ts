import { createClient } from "@libsql/client";

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL ?? "";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ?? "";

let client: ReturnType<typeof createClient> | null = null;
let dbInitialised = false;

export function getDb() {
  if (!client) {
    client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function initDb() {
  if (dbInitialised) return;
  const db = getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS game_state (
      room_code  TEXT PRIMARY KEY,
      state      TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  dbInitialised = true;
}
