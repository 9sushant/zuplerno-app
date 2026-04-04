import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(req: NextRequest) {
  const adminPin = req.headers.get("x-admin-pin") || "";
  const expected = process.env.ADMIN_PIN || "admin1234";
  if (adminPin !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const [totalUsers, activeUsers, totalPlans, totalReels, topSubjects, recentProgress] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM users WHERE status = 'active'`,
      sql`SELECT COUNT(*) as count FROM lesson_plans`,
      sql`SELECT COUNT(*) as count FROM reels`,
      sql`SELECT subject, COUNT(*) as count FROM lesson_plans GROUP BY subject ORDER BY count DESC LIMIT 5`,
      sql`
        SELECT sp.user_id, u.name, u.class, sp.subject, sp.chapter, sp.sessions, sp.last_active
        FROM student_progress sp
        JOIN users u ON u.id = sp.user_id
        ORDER BY sp.last_active DESC LIMIT 10
      `,
    ]);

    return NextResponse.json({
      total_users: Number(totalUsers.rows[0].count),
      active_users: Number(activeUsers.rows[0].count),
      total_plans: Number(totalPlans.rows[0].count),
      total_reels: Number(totalReels.rows[0].count),
      top_subjects: topSubjects.rows.map((r) => ({ subject: r.subject, count: Number(r.count) })),
      recent_progress: recentProgress.rows,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
