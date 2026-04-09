import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/users-store";
import {
  createAppointment,
  getAppointments,
  getAppointmentsByStudent,
} from "@/lib/appointments-store";

export async function GET(req: NextRequest) {
  try {
    const uid = req.cookies.get("ds_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const user = await getUserById(uid);
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }

    if (user.role === "teacher") {
      const appointments = await getAppointments();
      return NextResponse.json(appointments);
    } else {
      const appointments = await getAppointmentsByStudent(uid);
      return NextResponse.json(appointments);
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = req.cookies.get("ds_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const user = await getUserById(uid);
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }
    const body = await req.json();
    const { roll_no, parent_name, preferred_date, reason } = body;

    if (!roll_no || !parent_name || !preferred_date) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const appointment = await createAppointment({
      student_id: user.id,
      student_name: user.name,
      student_email: user.email,
      student_class: user.class ?? "",
      roll_no,
      parent_name,
      preferred_date,
      reason: reason || undefined,
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
