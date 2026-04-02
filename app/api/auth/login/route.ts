import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, toPublicUser } from "@/lib/users-store";

export async function POST(req: NextRequest) {
  try {
    const { email, pin } = await req.json() as { email: string; pin: string };

    if (!email?.trim() || !pin?.trim()) {
      return NextResponse.json({ error: "Email and PIN are required." }, { status: 400 });
    }

    const user = await getUserByEmail(email.trim());

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email. Please register first." },
        { status: 404 }
      );
    }

    if (user.status === "pending") {
      return NextResponse.json(
        { error: "Your account is pending approval. Your school admin will assign your PIN soon." },
        { status: 403 }
      );
    }

    if (user.pin !== pin.trim()) {
      return NextResponse.json({ error: "Incorrect PIN. Please check and try again." }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: toPublicUser(user) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
