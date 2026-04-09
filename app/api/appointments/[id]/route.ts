import { NextRequest, NextResponse } from "next/server";
import { getUserById } from "@/lib/users-store";
import { updateAppointment, AppointmentStatus } from "@/lib/appointments-store";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = req.cookies.get("ds_uid")?.value;
    if (!uid) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const user = await getUserById(uid);
    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Session expired." }, { status: 401 });
    }
    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Only teachers can update appointments." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, counsellor_notes } = body;

    const validStatuses: AppointmentStatus[] = ["pending", "counselled", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const updated = await updateAppointment(id, { status, counsellor_notes });
    if (!updated) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
