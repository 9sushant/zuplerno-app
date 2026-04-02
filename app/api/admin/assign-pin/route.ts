import { NextRequest, NextResponse } from "next/server";
import { assignPin, generatePin, getUserById } from "@/lib/users-store";

export async function POST(req: NextRequest) {
  try {
    const adminPin = req.headers.get("x-admin-pin") || "";
    const expected = process.env.ADMIN_PIN || "admin1234";

    if (adminPin !== expected) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { userId, customPin } = await req.json() as {
      userId: string;
      customPin?: string;
    };

    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    let pin = customPin?.trim() ?? "";
    if (pin) {
      if (!/^\d{8}$/.test(pin)) {
        return NextResponse.json(
          { error: "Custom PIN must be exactly 8 digits." },
          { status: 400 }
        );
      }
    } else {
      pin = generatePin();
    }

    await assignPin(userId, pin);

    return NextResponse.json({ success: true, pin, userId, name: user.name });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
