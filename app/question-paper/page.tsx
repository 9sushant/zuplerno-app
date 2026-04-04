"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CLASS_LIST, getSubjects, getChapters } from "@/lib/ncert-chapters";

type SessionUser = {
  id: string;
  name: string;
  role: "student" | "teacher";
  class: string | null;
  subject: string | null;
  status: string;
};

type DifficultyLevel = "easy" | "medium" | "hard" | "mixed";
type ExamType = "Unit Test" | "Half Yearly" | "Annual" | "Class Test" | "Practice Test";

export default function QuestionPaperPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

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
          setUser(data.user as SessionUser);
          setAuthChecked(true);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  if (!authChecked || !user) return null;

  return <QuestionPaperGenerator user={user} />;
}

function QuestionPaperGenerator({ user }: { user: SessionUser }) {
  const [selectedClass, setSelectedClass] = useState(user.class ?? "");
  const [selectedSubject, setSelectedSubject] = useState(user.subject ?? "");
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [chapterSearch, setChapterSearch] = useState("");
  const [examType, setExamType] = useState<ExamType>("Unit Test");
  const [totalMarks, setTotalMarks] = useState(40);
  const [mcqCount, setMcqCount] = useState(10);
  const [shortCount, setShortCount] = useState(5);
  const [longCount, setLongCount] = useState(3);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("mixed");
  const [generatedPaper, setGeneratedPaper] = useState("");
  const [loading, setLoading] = useState(false);
  const [configDone, setConfigDone] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const paperEndRef = useRef<HTMLDivElement>(null);

  const subjects = selectedClass ? getSubjects(selectedClass) : [];
  const chapters = selectedClass && selectedSubject ? getChapters(selectedClass, selectedSubject) : [];
  const filteredChapters = chapterSearch
    ? chapters.filter((c) => c.toLowerCase().includes(chapterSearch.toLowerCase()))
    : chapters;

  useEffect(() => {
    if (loading) paperEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [generatedPaper, loading]);

  function handleClassChange(cls: string) {
    setSelectedClass(cls);
    setSelectedSubject("");
    setSelectedChapters([]);
    setChapterSearch("");
  }

  function handleSubjectChange(sub: string) {
    setSelectedSubject(sub);
    setSelectedChapters([]);
    setChapterSearch("");
  }

  function toggleChapter(ch: string) {
    setSelectedChapters((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  }

  const marksFromQuestions = mcqCount + shortCount * Math.round(totalMarks * 0.3 / (shortCount || 1)) + longCount * Math.round(totalMarks * 0.5 / (longCount || 1));

  async function generatePaper() {
    if (!selectedClass || !selectedSubject || loading) return;
    setGeneratedPaper("");
    setLoading(true);
    setConfigDone(true);

    try {
      const res = await fetch("/api/question-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cls: selectedClass,
          subject: selectedSubject,
          chapters: selectedChapters,
          totalMarks,
          mcqCount,
          shortCount,
          longCount,
          difficulty,
          examType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setGeneratedPaper("Error: " + (err.error || "Something went wrong."));
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              text += parsed.text;
              setGeneratedPaper(text);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setGeneratedPaper("Network error: " + String(err));
    }

    setLoading(false);
  }

  function handlePrint() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head>
      <title>${selectedSubject} Question Paper — ${selectedClass}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; line-height: 1.7; margin: 32px; color: #111; }
        h1, h2, h3 { margin: 0 0 8px 0; }
        pre { white-space: pre-wrap; font-family: inherit; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        td, th { border: 1px solid #ccc; padding: 6px 10px; }
        @media print { body { margin: 16px; } }
      </style>
    </head><body><pre>${generatedPaper.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`);
    w.document.close();
    w.print();
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedPaper).then(() => {
      setSavedMsg("Copied!");
      setTimeout(() => setSavedMsg(""), 2000);
    });
  }

  if (!configDone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors">
              ← Home
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📝</div>
            <h1 className="text-2xl font-bold text-white">Question Paper Generator</h1>
            <p className="text-white/70 text-sm mt-1">Generate CBSE-standard question papers with answer keys</p>
          </div>

          <div className="space-y-5">
            {/* Class */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Class</label>
              <div className="grid grid-cols-4 gap-2">
                {CLASS_LIST.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => handleClassChange(cls)}
                    className={"py-2 px-1 rounded-lg text-sm font-medium transition-all border cursor-pointer " +
                      (selectedClass === cls
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")}
                  >
                    {cls.replace("Class ", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            {subjects.length > 0 && (
              <div>
                <label className="block text-white font-medium mb-2 text-sm">Subject</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => handleSubjectChange(sub)}
                      className={"py-1.5 px-3 rounded-lg text-sm transition-all border cursor-pointer " +
                        (selectedSubject === sub
                          ? "bg-violet-600 border-violet-500 text-white"
                          : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chapters */}
            {chapters.length > 0 && (
              <div>
                <label className="block text-white font-medium mb-2 text-sm">
                  Chapters <span className="text-white/50 font-normal">(select one or more, or skip for full syllabus)</span>
                </label>
                {chapters.length >= 8 && (
                  <input
                    type="text"
                    placeholder="Search chapters..."
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                    className="w-full bg-black/15 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 mb-2 outline-none focus:border-white/50"
                  />
                )}
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                  {filteredChapters.map((ch, i) => (
                    <button
                      key={ch}
                      onClick={() => toggleChapter(ch)}
                      className={"py-1 px-2.5 rounded-lg text-xs transition-all border text-left cursor-pointer " +
                        (selectedChapters.includes(ch)
                          ? "bg-violet-600 border-violet-500 text-white"
                          : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")}
                    >
                      <span className="text-white/40 mr-1">Ch {i + 1}</span>{ch}
                    </button>
                  ))}
                </div>
                {selectedChapters.length > 0 && (
                  <p className="text-xs text-violet-200/70 mt-1">{selectedChapters.length} chapter(s) selected</p>
                )}
              </div>
            )}

            {/* Exam Type */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Exam Type</label>
              <div className="flex flex-wrap gap-2">
                {(["Unit Test", "Half Yearly", "Annual", "Class Test", "Practice Test"] as ExamType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setExamType(t)}
                    className={"py-1.5 px-3 rounded-lg text-sm transition-all border cursor-pointer " +
                      (examType === t
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Total Marks */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Total Marks</label>
              <div className="flex flex-wrap gap-2">
                {[20, 25, 30, 40, 50, 80, 100].map((m) => (
                  <button
                    key={m}
                    onClick={() => setTotalMarks(m)}
                    className={"py-1.5 px-3 rounded-lg text-sm transition-all border cursor-pointer " +
                      (totalMarks === m
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Question counts */}
            <div className="bg-black/15 border border-white/20 rounded-xl p-4 space-y-4">
              <p className="text-white font-medium text-sm">Question Distribution</p>

              <div className="flex items-center gap-4">
                <label className="text-white/70 text-sm w-44">MCQs (1 mark each)</label>
                <input
                  type="range" min={0} max={20} value={mcqCount}
                  onChange={(e) => setMcqCount(Number(e.target.value))}
                  className="flex-1 accent-violet-500"
                />
                <span className="text-white font-mono w-6 text-center">{mcqCount}</span>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-white/70 text-sm w-44">Short Answer Qs</label>
                <input
                  type="range" min={0} max={15} value={shortCount}
                  onChange={(e) => setShortCount(Number(e.target.value))}
                  className="flex-1 accent-violet-500"
                />
                <span className="text-white font-mono w-6 text-center">{shortCount}</span>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-white/70 text-sm w-44">Long Answer Qs</label>
                <input
                  type="range" min={0} max={10} value={longCount}
                  onChange={(e) => setLongCount(Number(e.target.value))}
                  className="flex-1 accent-violet-500"
                />
                <span className="text-white font-mono w-6 text-center">{longCount}</span>
              </div>

              <p className="text-white/50 text-xs">
                Total questions: {mcqCount + shortCount + longCount} • Target marks: {totalMarks}
              </p>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Difficulty</label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { val: "easy", label: "Easy", desc: "Recall-based" },
                  { val: "medium", label: "Medium", desc: "Application" },
                  { val: "hard", label: "Hard", desc: "Analysis" },
                  { val: "mixed", label: "Mixed", desc: "Balanced" },
                ] as { val: DifficultyLevel; label: string; desc: string }[]).map((d) => (
                  <button
                    key={d.val}
                    onClick={() => setDifficulty(d.val)}
                    className={"py-2 px-4 rounded-xl text-sm transition-all border cursor-pointer text-left " +
                      (difficulty === d.val
                        ? "bg-violet-600 border-violet-500 text-white"
                        : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")}
                  >
                    <div className="font-medium">{d.label}</div>
                    <div className="text-xs opacity-70">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={generatePaper}
              disabled={!selectedClass || !selectedSubject}
              className={"w-full py-3 rounded-xl font-semibold text-white transition-all mt-2 " +
                (selectedClass && selectedSubject
                  ? "bg-violet-600 hover:bg-violet-500 cursor-pointer"
                  : "bg-white/10 cursor-not-allowed opacity-50")}
            >
              Generate Question Paper →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generated paper view
  return (
    <div className="flex flex-col bg-slate-950" style={{ minHeight: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <button
          onClick={() => { setConfigDone(false); setGeneratedPaper(""); }}
          className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
        >
          ← Back
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">
            📝 {selectedClass} • {selectedSubject} • {examType}
          </p>
          <p className="text-slate-500 text-xs">{totalMarks} marks • {mcqCount + shortCount + longCount} questions</p>
        </div>
        {generatedPaper && !loading && (
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all cursor-pointer"
            >
              {savedMsg || "Copy"}
            </button>
            <button
              onClick={handlePrint}
              className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white transition-all cursor-pointer"
            >
              Print / Save PDF
            </button>
            <button
              onClick={() => { setGeneratedPaper(""); generatePaper(); }}
              disabled={loading}
              className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-40"
            >
              Regenerate
            </button>
          </div>
        )}
      </div>

      {/* Paper content */}
      <div className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        {loading && !generatedPaper && (
          <div className="flex items-center gap-3 text-slate-400 mt-8">
            <div className="flex gap-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
            <span className="text-sm">Generating question paper…</span>
          </div>
        )}

        {generatedPaper && (
          <pre className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-slate-900/50 rounded-xl p-5 border border-white/10">
            {generatedPaper}
          </pre>
        )}

        <div ref={paperEndRef} />

        {generatedPaper && !loading && (
          <div className="mt-6 flex flex-wrap gap-3 justify-center pb-8">
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all cursor-pointer"
            >
              Print / Save as PDF
            </button>
            <button
              onClick={handleCopy}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all cursor-pointer"
            >
              {savedMsg || "Copy to Clipboard"}
            </button>
            <button
              onClick={() => { setGeneratedPaper(""); generatePaper(); }}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl transition-all cursor-pointer"
            >
              Generate Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
