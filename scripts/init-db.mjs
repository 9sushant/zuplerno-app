// Run ONCE after connecting Vercel Postgres in the dashboard:
//   vercel env pull .env.local
//   node scripts/init-db.mjs

import { createPool } from "@vercel/postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const pool = createPool({ connectionString: process.env.POSTGRES_URL });

async function run() {
  console.log("Creating tables...");

  await pool.sql`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      mobile      TEXT NOT NULL,
      role        TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
      class       TEXT,
      subject     TEXT,
      status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
      pin         TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("✓ users table ready");

  await pool.sql`
    CREATE TABLE IF NOT EXISTS reels (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      class       TEXT NOT NULL,
      subject     TEXT NOT NULL,
      chapter     TEXT NOT NULL DEFAULT '',
      filename    TEXT NOT NULL,
      blob_url    TEXT NOT NULL,
      mimetype    TEXT NOT NULL,
      filesize    INTEGER NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("✓ reels table ready");

  await pool.end();
  console.log("\nDatabase initialized! You can now deploy.");
}

run().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
