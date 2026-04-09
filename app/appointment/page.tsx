"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher";
  class: string | null;
};

export default function AppointmentPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [rollNo, setRollNo] = useState("");
  const [parentName, setParentName] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("ds_session");
    if (raw) {
      try {
        const u = JSON.parse(raw) as SessionUser;
        if (u.role !== "student") { router.replace("/"); return; }
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
          if (data.user.role !== "student") { router.replace("/"); return; }
          localStorage.setItem("ds_session", JSON.stringify(data.user));
          setUser(data.user);
          setAuthChecked(true);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!rollNo.trim() || !parentName.trim() || !preferredDate) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roll_no: rollNo, parent_name: parentName, preferred_date: preferredDate, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to book appointment."); return; }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authChecked || !user) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors">
          ← Back to Home
        </Link>

        <div className="bg-black/20 border border-white/20 rounded-2xl p-8">
          <div className="text-4xl mb-3">🗓️</div>
          <h1 className="text-2xl font-bold text-white mb-1">Book Counsellor Appointment</h1>
          <p className="text-white/60 text-sm mb-6">Request a session with the school counsellor.</p>

          {success ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-white text-xl font-semibold mb-2">Appointment Booked!</h2>
              <p className="text-white/70 text-sm mb-6">Your appointment request has been submitted. The counsellor will be in touch.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setSuccess(false); setRollNo(""); setParentName(""); setPreferredDate(""); setReason(""); }}
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Book Another
                </button>
                <Link
                  href="/"
                  className="bg-white text-[#00C4A0] text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-white/90 transition-colors"
                >
                  Go Home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student info — read-only */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/60 text-xs font-medium block mb-1">Your Name</label>
                  <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm opacity-70">
                    {user.name}
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-xs font-medium block mb-1">Class</label>
                  <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm opacity-70">
                    {user.class ?? "—"}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-white/60 text-xs font-medium block mb-1">Email</label>
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm opacity-70">
                  {user.email}
                </div>
              </div>

              {/* Roll number */}
              <div>
                <label className="text-white/60 text-xs font-medium block mb-1">
                  Roll Number <span className="text-red-300">*</span>
                </label>
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 23"
                  className="w-full bg-white/10 border border-white/20 focus:border-white/50 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm outline-none transition-colors"
                />
              </div>

              {/* Parent name */}
              <div>
                <label className="text-white/60 text-xs font-medium block mb-1">
                  Parent&apos;s Name <span className="text-red-300">*</span>
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Full name of parent/guardian"
                  className="w-full bg-white/10 border border-white/20 focus:border-white/50 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm outline-none transition-colors"
                />
              </div>

              {/* Preferred date */}
              <div>
                <label className="text-white/60 text-xs font-medium block mb-1">
                  Preferred Date <span className="text-red-300">*</span>
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  min={today}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 focus:border-white/50 rounded-xl px-4 py-2.5 text-white text-sm outline-none transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-white/60 text-xs font-medium block mb-1">Reason / Note (optional)</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly describe why you want to meet the counsellor..."
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 focus:border-white/50 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm outline-none transition-colors resize-none"
                />
              </div>

              {error && (
                <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-white text-[#00C4A0] font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {submitting ? "Booking..." : "Book Appointment"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
