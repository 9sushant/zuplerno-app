import { NextRequest, NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/users-store";
import { CLASS_LIST } from "@/lib/ncert-chapters";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, mobile, role, class: cls, subject } = body as {
      name: string;
      email: string;
      mobile: string;
      role: string;
      class?: string;
      subject?: string;
    };

    if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: "Email is required." }, { status: 400 });
    if (!mobile?.trim()) return NextResponse.json({ error: "Mobile number is required." }, { status: 400 });
    if (role !== "student" && role !== "teacher") {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (!/^\d{10}$/.test(mobile.replace(/\s+/g, ""))) {
      return NextResponse.json({ error: "Mobile must be a 10-digit number." }, { status: 400 });
    }

    if (role === "student") {
      if (!cls || !CLASS_LIST.includes(cls)) {
        return NextResponse.json({ error: "Please select a valid class." }, { status: 400 });
      }
    }

    if (role === "teacher") {
      if (!subject?.trim()) {
        return NextResponse.json({ error: "Please select a subject." }, { status: 400 });
      }
    }

    if (await getUserByEmail(email)) {
      return NextResponse.json(
        { error: "This email is already registered. Please login instead." },
        { status: 409 }
      );
    }

    const user = await createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.replace(/\s+/g, ""),
      role: role as "student" | "teacher",
      class: role === "student" ? (cls ?? null) : null,
      subject: role === "teacher" ? (subject?.trim() ?? null) : null,
    });

    return NextResponse.json({
      success: true,
      message: "Registration submitted! Your school admin will assign you a login PIN shortly.",
      id: user.id,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
