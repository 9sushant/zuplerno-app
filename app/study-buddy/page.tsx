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

type StudyMode = "explain" | "quiz" | "solve" | "revise" | "general";
type Message = { role: "user" | "assistant"; content: string };

const STUDY_MODES: { id: StudyMode; label: string; icon: string; desc: string; color: string }[] = [
  { id: "explain", label: "Explain It", icon: "💡", desc: "Get clear concept explanations with examples", color: "bg-amber-600 border-amber-500" },
  { id: "quiz", label: "Quiz Me", icon: "🎯", desc: "Interactive quiz with instant feedback & score", color: "bg-rose-600 border-rose-500" },
  { id: "solve", label: "Solve Together", icon: "🔢", desc: "Step-by-step problem solving with hints", color: "bg-blue-600 border-blue-500" },
  { id: "revise", label: "Quick Revise", icon: "📋", desc: "Exam-ready revision notes & key points", color: "bg-emerald-600 border-emerald-500" },
];

const MODE_COLORS: Record<StudyMode, string> = {
  explain: "bg-amber-600",
  quiz: "bg-rose-600",
  solve: "bg-blue-600",
  revise: "bg-emerald-600",
  general: "bg-teal-600",
};

const MODE_GREETINGS: Record<StudyMode, (cls: string, subject: string, chapter: string) => string> = {
  explain: (cls, sub, ch) =>
    `Hi! I'm your **Explain It** tutor for **${cls} — ${sub}**${ch ? `, Chapter: **${ch}**` : ""}.\n\nAsk me to explain any concept, term, or topic and I'll break it down clearly with examples. What would you like to understand?`,
  quiz: (cls, sub, ch) =>
    `Ready for a quiz on **${cls} — ${sub}**${ch ? `, Chapter: **${ch}**` : ""}? 🎯\n\nI'll ask you questions one by one, give instant feedback, and track your score. Type **"start"** to begin!`,
  solve: (cls, sub, ch) =>
    `Let's solve problems together from **${cls} — ${sub}**${ch ? `, Chapter: **${ch}**` : ""} 🔢\n\nShare any question or problem — I'll walk you through the solution step by step. What's the problem?`,
  revise: (cls, sub, ch) =>
    `Let's do a quick revision of **${cls} — ${sub}**${ch ? `, Chapter: **${ch}**` : ""} 📋\n\nTell me which topic you want to revise and I'll create a compact, exam-ready summary with key points, formulas, and tips!`,
  general: (cls, sub, ch) =>
    `Hi! I'm your Study Buddy for **${cls} — ${sub}**${ch ? `, Chapter: **${ch}**` : ""}.\n\nAsk me anything from your curriculum — I can explain concepts, solve problems, quiz you, or help you revise! What do you need?`,
};

export default function StudyBuddyPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("ds_session");
    if (raw) {
      try {
        const u = JSON.parse(raw) as SessionUser;
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

  return <StudyBuddyApp user={user} />;
}

function StudyBuddyApp({ user }: { user: SessionUser }) {
  const [stage, setStage] = useState<"pick-mode" | "pick-topic" | "chat">("pick-mode");
  const [studyMode, setStudyMode] = useState<StudyMode>("general");
  const [selectedClass, setSelectedClass] = useState(user.class ?? "");
  const [selectedSubject, setSelectedSubject] = useState(user.subject ?? "");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [chapterSearch, setChapterSearch] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const subjects = selectedClass ? getSubjects(selectedClass) : [];
  const chapters = selectedClass && selectedSubject ? getChapters(selectedClass, selectedSubject) : [];
  const filteredChapters = chapterSearch
    ? chapters.filter((c) => c.toLowerCase().includes(chapterSearch.toLowerCase()))
    : chapters;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleClassChange(cls: string) {
    setSelectedClass(cls);
    setSelectedSubject("");
    setSelectedChapter("");
    setChapterSearch("");
  }

  function handleSubjectChange(sub: string) {
    setSelectedSubject(sub);
    setSelectedChapter("");
    setChapterSearch("");
  }

  function startChat() {
    if (!selectedClass || !selectedSubject) return;
    const greeting = MODE_GREETINGS[studyMode](selectedClass, selectedSubject, selectedChapter);
    setMessages([{ role: "assistant", content: greeting }]);

    // Track progress
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class: selectedClass, subject: selectedSubject, chapter: selectedChapter }),
    }).catch(() => {});

    setStage("chat");
  }

  async function sendMessage(text?: string) {
    const messageText = text ?? input.trim();
    if (!messageText || loading) return;
    if (!text) setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: messageText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/study-buddy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          cls: selectedClass,
          subject: selectedSubject,
          chapter: selectedChapter,
          studyMode,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error: " + (err.error || "Something went wrong.") },
        ]);
        setLoading(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

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
              assistantText += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantText };
                return updated;
              });
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error: " + String(err) },
      ]);
    }

    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const modeColor = MODE_COLORS[studyMode];
  const modeInfo = STUDY_MODES.find((m) => m.id === studyMode);

  // Stage 1: Pick mode
  if (stage === "pick-mode") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors">
              ← Home
            </Link>
          </div>

          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🤖</div>
            <h1 className="text-2xl font-bold text-white">Study Buddy</h1>
            <p className="text-white/70 text-sm mt-1">Your personal AI tutor — pick how you want to study</p>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-6">
            {STUDY_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setStudyMode(mode.id);
                  setStage("pick-topic");
                }}
                className="group flex items-center gap-4 bg-black/20 border border-white/20 hover:bg-black/30 hover:border-white/40 rounded-2xl p-5 text-left transition-all cursor-pointer"
              >
                <div className="text-3xl flex-shrink-0">{mode.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold">{mode.label}</h3>
                  <p className="text-white/60 text-sm">{mode.desc}</p>
                </div>
                <div className="text-white/40 group-hover:text-white/70 transition-colors">→</div>
              </button>
            ))}
          </div>

          <p className="text-white/40 text-xs text-center">ZUPLERNO • Study Buddy</p>
        </div>
      </div>
    );
  }

  // Stage 2: Pick topic
  if (stage === "pick-topic") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setStage("pick-mode")}
              className="text-white/70 hover:text-white text-sm transition-colors"
            >
              ← Back
            </button>
          </div>

          <div className="text-center mb-8">
            <div className="text-4xl mb-2">{modeInfo?.icon}</div>
            <h1 className="text-xl font-bold text-white">{modeInfo?.label}</h1>
            <p className="text-white/60 text-sm mt-1">{modeInfo?.desc}</p>
          </div>

          <div className="space-y-4">
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
                        ? `${modeColor} border-transparent text-white`
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
                          ? `${modeColor} border-transparent text-white`
                          : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter */}
            {chapters.length > 0 && (
              <div>
                <label className="block text-white font-medium mb-2 text-sm">
                  Chapter <span className="text-white/50 font-normal">(optional)</span>
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
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredChapters.map((ch, i) => (
                    <button
                      key={ch}
                      onClick={() => setSelectedChapter(selectedChapter === ch ? "" : ch)}
                      className={"py-1 px-2.5 rounded-lg text-xs transition-all border text-left cursor-pointer " +
                        (selectedChapter === ch
                          ? `${modeColor} border-transparent text-white`
                          : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")}
                    >
                      <span className="text-white/40 mr-1">Ch {i + 1}</span>{ch}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={startChat}
              disabled={!selectedClass || !selectedSubject}
              className={"w-full py-3 rounded-xl font-semibold text-white transition-all mt-2 " +
                (selectedClass && selectedSubject
                  ? `${modeColor} hover:opacity-90 cursor-pointer`
                  : "bg-white/10 cursor-not-allowed opacity-50")}
            >
              {modeInfo?.icon} Start {modeInfo?.label} →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Stage 3: Chat
  const quickPrompts: Record<StudyMode, string[]> = {
    explain: ["Explain the main concept", "Give me an example", "Simplify this", "Real-world application?"],
    quiz: ["Start quiz", "Next question", "Harder question please", "Give me a hint", "Explain that answer"],
    solve: ["I'm stuck, give a hint", "Show full solution", "Another similar problem", "Explain the formula"],
    revise: ["Key points summary", "Important formulas", "Common exam questions", "Memory tricks"],
    general: ["Explain a concept", "Give me a practice question", "Help me revise", "Solve a problem"],
  };

  return (
    <div className="flex flex-col bg-slate-950" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <button
          onClick={() => setStage("pick-topic")}
          className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
        >
          ← Back
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-lg">{modeInfo?.icon}</span>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {selectedClass} • {selectedSubject}
              {selectedChapter && " • " + selectedChapter}
            </p>
            <p className="text-slate-500 text-xs">{modeInfo?.label} Mode</p>
          </div>
        </div>
        <button
          onClick={() => {
            setStage("pick-mode");
            setMessages([]);
          }}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          Switch mode
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <StudyBubble key={i} msg={msg} modeColor={modeColor} />
        ))}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="px-4 pt-3 border-t border-white/10 bg-slate-900/80 backdrop-blur"
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      >
        {/* Quick prompts */}
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          {quickPrompts[studyMode].map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="whitespace-nowrap text-xs px-3 py-1 bg-black/15 border border-white/20 rounded-full text-white/70 hover:text-white hover:border-white/40 transition-all cursor-pointer disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              studyMode === "quiz"
                ? "Type your answer here..."
                : studyMode === "solve"
                ? "Paste your question or problem..."
                : "Ask your Study Buddy anything..."
            }
            rows={1}
            className="flex-1 bg-black/20 border border-white/20 focus:border-white/40 rounded-xl px-4 py-3 text-white text-sm placeholder-white/40 outline-none resize-none transition-colors"
            style={{ maxHeight: "120px", overflowY: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={
              "p-3 rounded-xl transition-all " +
              (input.trim() && !loading
                ? `${modeColor} hover:opacity-90 text-white cursor-pointer`
                : "bg-white/5 text-slate-500 cursor-not-allowed")
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <p className="text-white/40 text-xs mt-1.5 text-center">Enter to send • Shift+Enter for new line</p>
      </div>
    </div>
  );
}

function StudyBubble({ msg, modeColor }: { msg: Message; modeColor: string }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white ${modeColor}`}>
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] bg-white rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 leading-relaxed shadow-sm">
        <MarkdownContent content={msg.content} />
      </div>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-base font-bold text-gray-900 mt-3 mb-1">
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-lg font-bold text-gray-900 mt-4 mb-1">
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-xl font-bold text-gray-900 mt-4 mb-2">
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        listItems.push(<li key={i}>{renderInline(lines[i].slice(2))}</li>);
        i++;
      }
      elements.push(
        <ul key={"ul-" + i} className="list-disc list-inside space-y-0.5 my-1 text-gray-700">
          {listItems}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        listItems.push(<li key={i}>{renderInline(lines[i].replace(/^\d+\. /, ""))}</li>);
        i++;
      }
      elements.push(
        <ol key={"ol-" + i} className="list-decimal list-inside space-y-0.5 my-1 text-gray-700">
          {listItems}
        </ol>
      );
      continue;
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="my-0.5">{renderInline(line)}</p>);
    }

    i++;
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-gray-900 font-semibold">{part.slice(2, -2)}</strong>;
    }
    const subparts = part.split(/(\*[^*]+\*)/g);
    return subparts.map((sub, j) => {
      if (sub.startsWith("*") && sub.endsWith("*") && sub.length > 2) {
        return <em key={j}>{sub.slice(1, -1)}</em>;
      }
      return sub;
    });
  });
}
