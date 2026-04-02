"use client";

import { useState } from "react";
import Link from "next/link";
import { CLASS_LIST, getSubjects } from "@/lib/ncert-chapters";

type Step = "role" | "details" | "success";
type Role = "student" | "teacher";

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const subjects = getSubjects("Class 11"); // All unique subjects across classes
  const allSubjects = Array.from(
    new Set(
      CLASS_LIST.flatMap((cls) => getSubjects(cls))
    )
  ).sort();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          mobile,
          role,
          class: selectedClass,
          subject: selectedSubject,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      setStep("success");
    } catch {
      setError("Network error. Please check your connection.");
    }

    setLoading(false);
  }

  // ── Step 1: Choose role ──
  if (step === "role") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg shadow-black/30">
              <img src="/zuplerno-logo.jpg" alt="ZUPLERNO" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-white">ZUPLERNO</h1>
            <p className="text-white/60 text-sm mt-1">Create your account</p>
          </div>

          <p className="text-slate-300 text-sm font-medium text-center mb-4">I am a...</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => { setRole("student"); setStep("details"); }}
              className="flex flex-col items-center gap-3 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-6 transition-all cursor-pointer group"
            >
              <span className="text-4xl">🎓</span>
              <span className="text-white font-semibold group-hover:text-emerald-400 transition-colors">Student</span>
            </button>
            <button
              onClick={() => { setRole("teacher"); setStep("details"); }}
              className="flex flex-col items-center gap-3 bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/40 rounded-2xl p-6 transition-all cursor-pointer group"
            >
              <span className="text-4xl">📚</span>
              <span className="text-white font-semibold group-hover:text-blue-400 transition-colors">Teacher</span>
            </button>
          </div>

          <p className="text-slate-500 text-sm text-center">
            Already have a PIN?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
              Login →
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 3: Success ──
  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Registration Submitted!</h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 text-left">
            <p className="text-slate-300 text-sm leading-relaxed">
              Your registration as a <span className="text-white font-semibold capitalize">{role}</span> has been sent to your school admin.
            </p>
            <div className="mt-3 flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">📱</span>
              <p className="text-slate-400 text-sm">
                Your admin will review your details and send you an <span className="text-white">8-digit login PIN</span> on your mobile number <span className="text-white">{mobile}</span>.
              </p>
            </div>
            <div className="mt-3 flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">⏱</span>
              <p className="text-slate-400 text-sm">This usually takes a few hours during school hours.</p>
            </div>
          </div>
          <Link
            href="/login"
            className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-center transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Step 2: Fill details ──
  const isStudent = role === "student";
  const accent = isStudent ? "emerald" : "blue";
  const canSubmit = name.trim() && email.trim() && mobile.trim() &&
    (isStudent ? selectedClass : selectedSubject);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C]">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => { setStep("role"); setError(""); }}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">
              {isStudent ? "Student" : "Teacher"} Registration
            </h1>
            <p className="text-slate-400 text-xs">Fill in your details below</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              autoFocus
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Mobile Number <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-slate-400 text-sm flex items-center flex-shrink-0">
                🇮🇳 +91
              </div>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                maxLength={10}
                className="flex-1 bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none transition-colors"
              />
            </div>
          </div>

          {/* Student: Class selector */}
          {isStudent && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Class <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CLASS_LIST.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={
                      "py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer " +
                      (selectedClass === cls
                        ? "bg-emerald-600 border-emerald-500 text-white"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {cls.replace("Class ", "")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Teacher: Subject selector */}
          {!isStudent && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Subject <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {allSubjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubject(sub)}
                    className={
                      "py-1.5 px-3 rounded-lg text-sm border transition-all cursor-pointer " +
                      (selectedSubject === sub
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10")
                    }
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className={
              "w-full py-3.5 rounded-xl font-bold text-white text-base transition-all mt-2 " +
              (canSubmit && !loading
                ? "bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-900/40"
                : "bg-white/10 opacity-50 cursor-not-allowed")
            }
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              "Submit Registration →"
            )}
          </button>

          <p className="text-slate-500 text-xs text-center">
            Already registered?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
