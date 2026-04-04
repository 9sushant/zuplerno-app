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

    const publicUser = toPublicUser(user);
    const res = NextResponse.json({ success: true, user: publicUser });

    // Set HttpOnly session cookie (30 days)
    res.cookies.set("ds_uid", user.id, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
