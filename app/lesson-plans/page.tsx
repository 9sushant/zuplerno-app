"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type LessonPlan = {
  id: string;
  class: string;
  subject: string;
  chapter: string;
  content: string;
  created_at: string;
};

export default function LessonPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lesson-plans")
      .then((r) => {
        if (r.status === 401) { router.replace("/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setPlans(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this lesson plan?")) return;
    setDeleting(id);
    await fetch("/api/lesson-plans", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPlans((prev) => prev.filter((p) => p.id !== id));
    setDeleting(null);
  }

  function handleCopy(content: string, id: string) {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handlePrint(plan: LessonPlan) {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>${plan.subject} — ${plan.class}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.6; margin: 32px; color: #111; }
        pre { white-space: pre-wrap; font-family: inherit; }
      </style>
    </head><body><pre>${plan.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
    <script>window.onload=function(){window.print();window.close();}<\/script></body></html>`);
    w.document.close();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-white font-bold text-lg">Saved Lesson Plans</h1>
            {!loading && <p className="text-white/60 text-sm">{plans.length} plan{plans.length !== 1 ? "s" : ""} saved</p>}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && plans.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-white font-semibold text-lg mb-2">No saved plans yet</h2>
            <p className="text-white/60 text-sm mb-6 max-w-xs">
              Generate a lesson plan and click &quot;Save Plan&quot; to keep it here.
            </p>
            <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
              Create Lesson Plan
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
              {/* Summary row */}
              <div
                className="px-4 py-3 cursor-pointer flex items-center gap-3"
                onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {plan.subject} — {plan.class}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5 truncate">
                    {plan.chapter || "No chapter"} •{" "}
                    {new Date(plan.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
                <svg
                  className={"w-4 h-4 text-white/50 transition-transform flex-shrink-0 " + (expanded === plan.id ? "rotate-180" : "")}
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded content */}
              {expanded === plan.id && (
                <div className="border-t border-white/10">
                  <div className="px-4 py-3 bg-white/5 max-h-80 overflow-y-auto">
                    <pre className="text-white/90 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                      {plan.content}
                    </pre>
                  </div>
                  <div className="flex gap-2 px-4 py-3 border-t border-white/10">
                    <button
                      onClick={() => handleCopy(plan.content, plan.id)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {copied === plan.id ? "✓ Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => handlePrint(plan)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      Print / PDF
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      disabled={deleting === plan.id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded-lg transition-colors cursor-pointer ml-auto disabled:opacity-50"
                    >
                      {deleting === plan.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
