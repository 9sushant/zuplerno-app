"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AppointmentStatus = "pending" | "counselled" | "cancelled";

type Appointment = {
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

type SessionUser = {
  id: string;
  name: string;
  role: "student" | "teacher";
};

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-yellow-400/20 text-yellow-200 border-yellow-400/30",
  counselled: "bg-green-400/20 text-green-200 border-green-400/30",
  cancelled: "bg-red-400/20 text-red-200 border-red-400/30",
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "Pending",
  counselled: "Counselled",
  cancelled: "Cancelled",
};

export default function BookedAppointmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<AppointmentStatus>("pending");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | "all">("all");

  useEffect(() => {
    const raw = localStorage.getItem("ds_session");
    if (raw) {
      try {
        const u = JSON.parse(raw) as SessionUser;
        if (u.role !== "teacher") { router.replace("/"); return; }
        setUser(u);
        setAuthChecked(true);
        return;
      } catch {
        localStorage.removeItem("ds_session");
      }
    }
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          if (data.user.role !== "teacher") { router.replace("/"); return; }
          localStorage.setItem("ds_session", JSON.stringify(data.user));
          setUser(data.user);
          setAuthChecked(true);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    fetch("/api/appointments")
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setAppointments(data as Appointment[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authChecked, router]);

  function startEdit(appt: Appointment) {
    setEditingId(appt.id);
    setEditStatus(appt.status);
    setEditNotes(appt.counsellor_notes ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNotes("");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this appointment? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (res.ok) setAppointments((prev) => prev.filter((a) => a.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, counsellor_notes: editNotes }),
      });
      const updated = await res.json();
      if (res.ok) {
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  const filtered = filterStatus === "all"
    ? appointments
    : appointments.filter((a) => a.status === filterStatus);

  const counts = {
    all: appointments.length,
    pending: appointments.filter((a) => a.status === "pending").length,
    counselled: appointments.filter((a) => a.status === "counselled").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  if (!authChecked || !user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors">
            ← Back
          </Link>
          <h1 className="text-white font-bold text-xl">Booked Appointments</h1>
          <div className="w-12" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {(["all", "pending", "counselled", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-xl p-3 text-center border transition-all cursor-pointer ${
                filterStatus === s
                  ? "bg-white/25 border-white/50"
                  : "bg-black/15 border-white/15 hover:bg-black/20"
              }`}
            >
              <div className="text-white font-bold text-xl">{counts[s]}</div>
              <div className="text-white/60 text-xs capitalize">{s}</div>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center text-white/60 py-20">Loading appointments...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-white/60 py-20 bg-black/15 rounded-2xl border border-white/15">
            No {filterStatus !== "all" ? filterStatus : ""} appointments found.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((appt) => (
              <div
                key={appt.id}
                className="bg-black/20 border border-white/20 rounded-2xl p-5"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold">{appt.student_name}</span>
                      <span className="text-white/50 text-xs">Class {appt.student_class}</span>
                      <span className="text-white/50 text-xs">Roll {appt.roll_no}</span>
                    </div>
                    <div className="text-white/50 text-xs mt-0.5">{appt.student_email}</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${STATUS_COLORS[appt.status]}`}>
                    {STATUS_LABELS[appt.status]}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 mb-3">
                  <div>
                    <span className="text-white/40 text-xs">Parent&apos;s Name</span>
                    <p className="text-white/80 text-sm">{appt.parent_name}</p>
                  </div>
                  <div>
                    <span className="text-white/40 text-xs">Preferred Date</span>
                    <p className="text-white/80 text-sm">
                      {new Date(appt.preferred_date).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/40 text-xs">Booked On</span>
                    <p className="text-white/80 text-sm">
                      {new Date(appt.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {appt.reason && (
                  <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-3">
                    <span className="text-white/40 text-xs block mb-0.5">Reason</span>
                    <p className="text-white/70 text-sm">{appt.reason}</p>
                  </div>
                )}

                {appt.counsellor_notes && editingId !== appt.id && (
                  <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-3">
                    <span className="text-white/40 text-xs block mb-0.5">Counsellor Notes</span>
                    <p className="text-white/70 text-sm">{appt.counsellor_notes}</p>
                  </div>
                )}

                {/* Edit panel */}
                {editingId === appt.id ? (
                  <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                    <div>
                      <label className="text-white/50 text-xs block mb-1">Update Status</label>
                      <div className="flex gap-2 flex-wrap">
                        {(["pending", "counselled", "cancelled"] as AppointmentStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setEditStatus(s)}
                            className={`text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer capitalize ${
                              editStatus === s
                                ? STATUS_COLORS[s] + " font-semibold"
                                : "bg-white/5 border-white/20 text-white/60 hover:bg-white/10"
                            }`}
                          >
                            {STATUS_LABELS[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-white/50 text-xs block mb-1">Counsellor Notes</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Add notes about the counselling session..."
                        rows={3}
                        className="w-full bg-white/10 border border-white/20 focus:border-white/40 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm outline-none transition-colors resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(appt.id)}
                        disabled={saving}
                        className="bg-white text-[#00C4A0] font-semibold text-sm px-4 py-2 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-white/10 border border-white/20 text-white/70 text-sm px-4 py-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center gap-4">
                    <button
                      onClick={() => startEdit(appt)}
                      className="text-xs text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Edit / Update Status
                    </button>
                    <button
                      onClick={() => handleDelete(appt.id)}
                      disabled={deleting === appt.id}
                      className="text-xs text-red-300/60 hover:text-red-300 underline underline-offset-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {deleting === appt.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
