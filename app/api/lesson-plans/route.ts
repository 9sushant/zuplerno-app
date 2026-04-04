import { NextRequest, NextResponse } from "next/server";
import { saveLessonPlan, getLessonPlansByUser, deleteLessonPlan } from "@/lib/lesson-plans-store";
import { getUserById } from "@/lib/users-store";

async function getAuthUser(req: NextRequest) {
  const uid = req.cookies.get("ds_uid")?.value;
  if (!uid) return null;
  const user = await getUserById(uid);
  return user?.status === "active" ? user : null;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const plans = await getLessonPlansByUser(user.id);
    return NextResponse.json(plans);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const body = await req.json() as {
      class: string;
      subject: string;
      chapter?: string;
      content: string;
    };

    if (!body.content?.trim()) {
      return NextResponse.json({ error: "Content is required." }, { status: 400 });
    }

    const plan = await saveLessonPlan({
      user_id: user.id,
      class: body.class ?? "",
      subject: body.subject ?? "",
      chapter: body.chapter ?? "",
      content: body.content,
    });

    return NextResponse.json(plan);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { id } = await req.json() as { id: string };
    if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });

    const deleted = await deleteLessonPlan(id, user.id);
    return NextResponse.json({ deleted });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
