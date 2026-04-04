import { sql } from "@vercel/postgres";

export type ProgressEntry = {
  id: string;
  user_id: string;
  class: string;
  subject: string;
  chapter: string;
  sessions: number;
  last_active: string;
};

export async function recordProgress(
  userId: string,
  cls: string,
  subject: string,
  chapter: string
): Promise<void> {
  // Upsert: increment session count if row exists, else insert
  await sql`
    INSERT INTO student_progress (id, user_id, class, subject, chapter, sessions, last_active)
    VALUES (
      ${Date.now().toString() + Math.random().toString(36).slice(2, 5)},
      ${userId}, ${cls}, ${subject}, ${chapter}, 1, NOW()
    )
    ON CONFLICT (user_id, class, subject, chapter)
    DO UPDATE SET sessions = student_progress.sessions + 1, last_active = NOW()
  `;
}

export async function getProgressByUser(userId: string): Promise<ProgressEntry[]> {
  const result = await sql`
    SELECT id, user_id, class, subject, chapter, sessions, last_active
    FROM student_progress
    WHERE user_id = ${userId}
    ORDER BY last_active DESC
  `;
  return result.rows as ProgressEntry[];
}

export async function getAllStudentProgress(): Promise<Array<{
  user_id: string;
  name: string;
  class: string;
  subject: string;
  chapter: string;
  sessions: number;
  last_active: string;
}>> {
  const result = await sql`
    SELECT sp.user_id, u.name, sp.class, sp.subject, sp.chapter, sp.sessions, sp.last_active
    FROM student_progress sp
    JOIN users u ON u.id = sp.user_id
    ORDER BY sp.last_active DESC
    LIMIT 200
  `;
  return result.rows as ReturnType<typeof getAllStudentProgress> extends Promise<infer T> ? T : never;
}
