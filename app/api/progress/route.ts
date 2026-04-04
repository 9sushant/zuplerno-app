import { NextRequest, NextResponse } from "next/server";
import { recordProgress, getProgressByUser } from "@/lib/progress-store";
import { getUserById } from "@/lib/users-store";

async function getAuthUser(req: NextRequest) {
  const uid = req.cookies.get("ds_uid")?.value;
  if (!uid) return null;
  const user = await getUserById(uid);
  return user?.status === "active" ? user : null;
}

// GET: fetch current user's progress
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const progress = await getProgressByUser(user.id);
    return NextResponse.json(progress);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST: record a session
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body = await req.json() as { class: string; subject: string; chapter?: string };
    await recordProgress(user.id, body.class ?? "", body.subject ?? "", body.chapter ?? "");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
