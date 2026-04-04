import { NextRequest, NextResponse } from "next/server";
import { getUserById, toPublicUser } from "@/lib/users-store";

export async function GET(req: NextRequest) {
  try {
    const uid = req.cookies.get("ds_uid")?.value;
    if (!uid) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const user = await getUserById(uid);
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
