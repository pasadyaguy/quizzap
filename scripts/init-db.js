// Run with: node scripts/init-db.js
// Make sure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are in your .env.local first

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@libsql/client");

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  await db.execute(`
    CREATE TABLE IF NOT EXISTS game_state (
      room_code  TEXT PRIMARY KEY,
      state      TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);
  console.log("✅ Turso DB initialised — table game_state ready.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
