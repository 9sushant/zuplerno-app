import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getUserById } from "@/lib/users-store";

async function getAuthUser(req: NextRequest) {
  const uid = req.cookies.get("ds_uid")?.value;
  if (!uid) return null;
  const user = await getUserById(uid);
  return user?.status === "active" ? user : null;
}

// GET /api/reels/likes?reel_id=xxx  — get like status + count for a reel
export async function GET(req: NextRequest) {
  try {
    const reelId = req.nextUrl.searchParams.get("reel_id");
    if (!reelId) return NextResponse.json({ error: "reel_id required." }, { status: 400 });

    const user = await getAuthUser(req);

    const countResult = await sql`SELECT COUNT(*) as count FROM reel_likes WHERE reel_id = ${reelId}`;
    const count = Number(countResult.rows[0].count);

    let liked = false;
    if (user) {
      const likedResult = await sql`
        SELECT 1 FROM reel_likes WHERE reel_id = ${reelId} AND user_id = ${user.id} LIMIT 1
      `;
      liked = likedResult.rows.length > 0;
    }

    return NextResponse.json({ count, liked });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST — toggle like
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { reel_id } = await req.json() as { reel_id: string };
    if (!reel_id) return NextResponse.json({ error: "reel_id required." }, { status: 400 });

    const existing = await sql`
      SELECT 1 FROM reel_likes WHERE reel_id = ${reel_id} AND user_id = ${user.id} LIMIT 1
    `;

    if (existing.rows.length > 0) {
      await sql`DELETE FROM reel_likes WHERE reel_id = ${reel_id} AND user_id = ${user.id}`;
    } else {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 5);
      await sql`INSERT INTO reel_likes (id, reel_id, user_id, created_at) VALUES (${id}, ${reel_id}, ${user.id}, NOW())`;
    }

    const countResult = await sql`SELECT COUNT(*) as count FROM reel_likes WHERE reel_id = ${reel_id}`;
    return NextResponse.json({ liked: existing.rows.length === 0, count: Number(countResult.rows[0].count) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// GET /api/reels/likes/user — get all reel_ids liked by current user
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ liked_ids: [] });

    const result = await sql`
      SELECT rl.reel_id FROM reel_likes rl WHERE rl.user_id = ${user.id} ORDER BY rl.created_at DESC
    `;
    return NextResponse.json({ liked_ids: result.rows.map((r) => r.reel_id as string) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
