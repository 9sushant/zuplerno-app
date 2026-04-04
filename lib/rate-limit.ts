import { sql } from "@vercel/postgres";
import { getUserById } from "./users-store";

const DAILY_LIMITS: Record<"student" | "teacher", number> = {
  teacher: 4,
  student: 8,
};

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS api_usage (
      user_id TEXT NOT NULL,
      date    TEXT NOT NULL,
      count   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, date)
    )
  `;
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; limit: number; role: string };

export async function checkAndIncrementUsage(userId: string): Promise<RateLimitResult> {
  await ensureTable();

  const user = await getUserById(userId);
  if (!user) return { ok: false, limit: 0, role: "unknown" };

  const role = user.role as "student" | "teacher";
  const limit = DAILY_LIMITS[role];
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC

  // Upsert: insert row or increment if exists
  const result = await sql`
    INSERT INTO api_usage (user_id, date, count)
    VALUES (${userId}, ${today}, 1)
    ON CONFLICT (user_id, date)
    DO UPDATE SET count = api_usage.count + 1
    RETURNING count
  `;

  const count = result.rows[0].count as number;

  if (count > limit) {
    // Undo the increment so they don't go further over
    await sql`
      UPDATE api_usage SET count = ${limit} WHERE user_id = ${userId} AND date = ${today}
    `;
    return { ok: false, limit, role };
  }

  return { ok: true, remaining: limit - count };
}
