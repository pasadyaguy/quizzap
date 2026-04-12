import { createClient } from "@libsql/client";

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL ?? "libsql://quizapp-pasadyaguy.aws-us-east-2.turso.io";
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ?? "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzYwMDU3OTgsImlkIjoiMDE5ZDgyMzAtMmQwMS03NmQyLTgxYjEtYzFmYzJjZGEwMTFlIiwicmlkIjoiNjdlOTc1NzktOWY2OS00ZjU3LTk1MTgtZjM5YjIzZjY5M2U5In0.gsD-QHsgAaK-A2gUkobApuNxDG0fmSpds1xDsz7O2FPkAJOkaLbvS9jzRv3nR7Uigb1wmL-s6DC76hWfc_cjBg";

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
