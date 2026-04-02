"use client";

import { useState, useEffect, useCallback } from "react";

type UserStatus = "pending" | "active";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: "student" | "teacher";
  class: string | null;
  subject: string | null;
  status: UserStatus;
  pin: string | null;
  created_at: string;
};

type Tab = "pending" | "active" | "all";

export default function AdminPage() {
  const [adminPin, setAdminPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [customPin, setCustomPin] = useState("");
  const [justAssigned, setJustAssigned] = useState<{ name: string; pin: string } | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const fetchUsers = useCallback(async (pin: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        headers: { "x-admin-pin": pin },
      });
      if (!res.ok) {
        setAuthError("Wrong admin PIN.");
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUsers(data);
      setAuthenticated(true);
    } catch {
      setAuthError("Connection error.");
    }
    setLoading(false);
  }, []);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError("");
    await fetchUsers(adminPin);
  }

  async function assignPin(userId: string) {
    setAssigningId(userId);
    try {
      const res = await fetch("/api/admin/assign-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-pin": adminPin,
        },
        body: JSON.stringify({
          userId,
          customPin: customPin || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to assign PIN.");
        setAssigningId(null);
        return;
      }

      setJustAssigned({ name: data.name, pin: data.pin });
      setCustomPin("");
      await fetchUsers(adminPin);
    } catch {
      alert("Connection error.");
    }
    setAssigningId(null);
  }

  async function copyToClipboard(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPin(id);
      setTimeout(() => setCopiedPin(null), 2000);
    } catch {
      // fallback
    }
  }

  const filtered = users.filter((u) => {
    if (tab === "pending") return u.status === "pending";
    if (tab === "active") return u.status === "active";
    return true;
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;

  // ── Auth screen ──
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm mt-1">Dalimss Sunbeam School</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">Admin PIN</label>
              <input
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Enter admin PIN"
                autoFocus
                className="w-full bg-white/5 border border-white/10 focus:border-amber-500/60 rounded-xl px-4 py-3.5 text-white text-center text-2xl tracking-widest placeholder-slate-600 placeholder:text-base placeholder:tracking-normal outline-none transition-colors"
              />
              <p className="text-slate-600 text-xs mt-1.5 text-center">Set via ADMIN_PIN in .env.local</p>
            </div>
            {authError && (
              <p className="text-red-400 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              disabled={!adminPin.trim() || loading}
              className={
                "w-full py-3.5 font-bold text-white rounded-xl transition-all " +
                (!adminPin.trim() || loading
                  ? "bg-white/10 opacity-50 cursor-not-allowed"
                  : "bg-amber-600 hover:bg-amber-500 cursor-pointer")
              }
            >
              {loading ? "Verifying..." : "Access Admin Panel →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Admin dashboard ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 text-sm">{users.length} total users</p>
          </div>
          <button
            onClick={() => fetchUsers(adminPin)}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Just assigned PIN banner */}
        {justAssigned && (
          <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-2xl p-4 mb-5 flex items-center justify-between">
            <div>
              <p className="text-emerald-300 font-semibold text-sm">PIN assigned to {justAssigned.name}</p>
              <p className="text-white font-mono text-2xl font-bold tracking-widest mt-1">{justAssigned.pin}</p>
              <p className="text-emerald-400/70 text-xs mt-1">Share this PIN with the user via WhatsApp / SMS</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => copyToClipboard(justAssigned.pin, "banner")}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                {copiedPin === "banner" ? "Copied!" : "Copy PIN"}
              </button>
              <button
                onClick={() => setJustAssigned(null)}
                className="px-3 py-2 bg-white/10 text-white/60 text-xs rounded-lg cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {(["pending", "active", "all"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer capitalize flex items-center gap-1.5 " +
                (tab === t
                  ? "bg-blue-600 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10")
              }
            >
              {t}
              {t === "pending" && pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Users list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">{tab === "pending" ? "✅" : "👥"}</p>
            <p className="text-slate-400">
              {tab === "pending" ? "No pending registrations!" : "No users found."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                customPin={customPin}
                setCustomPin={setCustomPin}
                assigning={assigningId === user.id}
                copiedPin={copiedPin}
                onAssign={() => assignPin(user.id)}
                onCopy={(pin) => copyToClipboard(pin, user.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserCard({
  user,
  customPin,
  setCustomPin,
  assigning,
  copiedPin,
  onAssign,
  onCopy,
}: {
  user: AdminUser;
  customPin: string;
  setCustomPin: (v: string) => void;
  assigning: boolean;
  copiedPin: string | null;
  onAssign: () => void;
  onCopy: (pin: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPending = user.status === "pending";

  return (
    <div className={
      "rounded-2xl border transition-all " +
      (isPending
        ? "bg-amber-900/10 border-amber-500/20"
        : "bg-white/5 border-white/10")
    }>
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ background: user.role === "student" ? "#059669" : "#2563eb" }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-semibold text-sm truncate">{user.name}</span>
              <span className={
                "text-xs px-2 py-0.5 rounded-full font-medium " +
                (user.role === "student"
                  ? "bg-emerald-900/40 text-emerald-300"
                  : "bg-blue-900/40 text-blue-300")
              }>
                {user.role}
              </span>
              <span className={
                "text-xs px-2 py-0.5 rounded-full font-medium " +
                (isPending
                  ? "bg-amber-900/40 text-amber-300"
                  : "bg-emerald-900/40 text-emerald-300")
              }>
                {isPending ? "⏳ Pending" : "✓ Active"}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5 truncate">{user.email}</p>
          </div>

          <svg
            className={"w-4 h-4 text-slate-500 transition-transform flex-shrink-0 " + (expanded ? "rotate-180" : "")}
            fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-slate-500 text-xs">Mobile</span>
              <p className="text-slate-200">+91 {user.mobile}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">{user.role === "student" ? "Class" : "Subject"}</span>
              <p className="text-slate-200">{user.class || user.subject || "—"}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Registered</span>
              <p className="text-slate-200">{new Date(user.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            {!isPending && user.pin && (
              <div>
                <span className="text-slate-500 text-xs">Current PIN</span>
                <p className="text-white font-mono font-bold tracking-widest">{user.pin}</p>
              </div>
            )}
          </div>

          {/* Active: copy PIN */}
          {!isPending && user.pin && (
            <button
              onClick={() => onCopy(user.pin!)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-colors cursor-pointer"
            >
              {copiedPin === user.id ? "✓ PIN Copied!" : "Copy PIN for Sharing"}
            </button>
          )}

          {/* Pending: assign PIN */}
          {isPending && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="Custom 8-digit PIN (optional)"
                  className="flex-1 bg-white/5 border border-white/10 focus:border-amber-500/50 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 outline-none transition-colors font-mono tracking-widest"
                />
              </div>
              <button
                onClick={onAssign}
                disabled={assigning}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors cursor-pointer text-sm"
              >
                {assigning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Assigning...
                  </span>
                ) : (
                  customPin.length === 8 ? "Assign This PIN" : "Generate & Assign PIN"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
