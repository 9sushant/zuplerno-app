import { NextRequest, NextResponse } from "next/server";
import { getUsers } from "@/lib/users-store";

export async function GET(req: NextRequest) {
  const adminPin = req.headers.get("x-admin-pin") || "";
  const expected = process.env.ADMIN_PIN || "admin1234";

  if (adminPin !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const users = (await getUsers()).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      mobile: u.mobile,
      role: u.role,
      class: u.class,
      subject: u.subject,
      status: u.status,
      pin: u.pin,
      created_at: u.created_at,
    }));

    return NextResponse.json(users);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
