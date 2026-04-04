import { sql } from "@vercel/postgres";

export type LessonPlan = {
  id: string;
  user_id: string;
  class: string;
  subject: string;
  chapter: string;
  content: string;
  created_at: string;
};

export async function saveLessonPlan(
  plan: Omit<LessonPlan, "id" | "created_at">
): Promise<LessonPlan> {
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  const result = await sql`
    INSERT INTO lesson_plans (id, user_id, class, subject, chapter, content, created_at)
    VALUES (${id}, ${plan.user_id}, ${plan.class}, ${plan.subject}, ${plan.chapter}, ${plan.content}, NOW())
    RETURNING *
  `;
  return result.rows[0] as LessonPlan;
}

export async function getLessonPlansByUser(userId: string): Promise<LessonPlan[]> {
  const result = await sql`
    SELECT id, user_id, class, subject, chapter, content, created_at
    FROM lesson_plans
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return result.rows as LessonPlan[];
}

export async function deleteLessonPlan(id: string, userId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM lesson_plans WHERE id = ${id} AND user_id = ${userId}
  `;
  return (result.rowCount ?? 0) > 0;
}

export async function getLessonPlanStats(): Promise<{ total: number; by_subject: Array<{ subject: string; count: number }> }> {
  const total = await sql`SELECT COUNT(*) as count FROM lesson_plans`;
  const bySubject = await sql`
    SELECT subject, COUNT(*) as count FROM lesson_plans
    GROUP BY subject ORDER BY count DESC LIMIT 10
  `;
  return {
    total: Number(total.rows[0].count),
    by_subject: bySubject.rows.map((r) => ({ subject: r.subject, count: Number(r.count) })),
  };
}
