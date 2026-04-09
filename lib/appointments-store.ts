import { sql } from "@vercel/postgres";

export type AppointmentStatus = "pending" | "counselled" | "cancelled";

export type Appointment = {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  student_class: string;
  roll_no: string;
  parent_name: string;
  preferred_date: string;
  reason: string | null;
  status: AppointmentStatus;
  counsellor_notes: string | null;
  created_at: string;
};

export async function ensureAppointmentsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      student_email TEXT NOT NULL,
      student_class TEXT NOT NULL,
      roll_no TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      preferred_date TEXT NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      counsellor_notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function createAppointment(data: {
  student_id: string;
  student_name: string;
  student_email: string;
  student_class: string;
  roll_no: string;
  parent_name: string;
  preferred_date: string;
  reason?: string;
}): Promise<Appointment> {
  await ensureAppointmentsTable();
  const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
  const result = await sql`
    INSERT INTO appointments (
      id, student_id, student_name, student_email, student_class,
      roll_no, parent_name, preferred_date, reason, status, counsellor_notes, created_at
    ) VALUES (
      ${id},
      ${data.student_id},
      ${data.student_name},
      ${data.student_email},
      ${data.student_class},
      ${data.roll_no},
      ${data.parent_name},
      ${data.preferred_date},
      ${data.reason ?? null},
      'pending',
      NULL,
      NOW()
    )
    RETURNING *
  `;
  return result.rows[0] as Appointment;
}

export async function getAppointments(): Promise<Appointment[]> {
  await ensureAppointmentsTable();
  const result = await sql`
    SELECT * FROM appointments ORDER BY created_at DESC
  `;
  return result.rows as Appointment[];
}

export async function getAppointmentsByStudent(studentId: string): Promise<Appointment[]> {
  await ensureAppointmentsTable();
  const result = await sql`
    SELECT * FROM appointments WHERE student_id = ${studentId} ORDER BY created_at DESC
  `;
  return result.rows as Appointment[];
}

export async function updateAppointment(
  id: string,
  data: { status: AppointmentStatus; counsellor_notes?: string }
): Promise<Appointment | null> {
  await ensureAppointmentsTable();
  const result = await sql`
    UPDATE appointments
    SET status = ${data.status}, counsellor_notes = ${data.counsellor_notes ?? null}
    WHERE id = ${id}
    RETURNING *
  `;
  return (result.rows[0] as Appointment) ?? null;
}
