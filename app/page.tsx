"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CLASS_LIST, getSubjects, getChapters } from "@/lib/ncert-chapters";

type Mode = "home" | "teacher" | "student";
type Message = { role: "user" | "assistant"; content: string };

type SessionUser = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: "student" | "teacher";
  class: string | null;
  subject: string | null;
  status: string;
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("home");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("ds_session");
    if (!raw) {
      router.replace("/login");
      return;
    }
    try {
      setUser(JSON.parse(raw) as SessionUser);
    } catch {
      router.replace("/login");
      return;
    }
    setAuthChecked(true);
  }, [router]);

  if (!authChecked || !user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C]">
      {mode === "home" && <HomePage user={user} setMode={setMode} />}
      {mode === "teacher" && (
        <ChatPage mode="teacher" goHome={() => setMode("home")} user={user} />
      )}
      {mode === "student" && (
        <ChatPage mode="student" goHome={() => setMode("home")} user={user} />
      )}
    </main>
  );
}

function HomePage({
  user,
  setMode,
}: {
  user: SessionUser;
  setMode: (m: Mode) => void;
}) {
  const router = useRouter();
  const isTeacher = user.role === "teacher";

  function logout() {
    localStorage.removeItem("ds_session");
    router.replace("/login");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4">
        <Link href="/admin" className="text-white/40 hover:text-white/70 text-xs transition-colors">
          Admin
        </Link>
        <button
          onClick={logout}
          className="text-white/50 hover:text-white text-xs transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>

      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg shadow-black/30">
            <img src="/zuplerno-logo.jpg" alt="ZUPLERNO" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">ZUPLERNO</h1>
            <p className="text-white/70 text-sm tracking-wider">AI Learning Assistant</p>
          </div>
        </div>
        {/* User greeting */}
        <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-4 py-1.5 mt-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: "rgba(0,0,0,0.25)" }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-white text-sm">
            {user.name}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/20 text-white">
            {isTeacher ? user.subject : user.class}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-2xl">
        {/* Teacher card — only for teachers */}
        {isTeacher && (
          <button
            onClick={() => setMode("teacher")}
            className="group bg-black/20 border border-white/20 hover:bg-black/30 hover:border-white/40 rounded-2xl p-8 text-left transition-all duration-200 cursor-pointer"
          >
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-white mb-2">Lesson Planner</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Generate detailed lesson plans with 5E methodology, Bloom&apos;s taxonomy, NCERT alignment, and board exam tips.
            </p>
            <div className="mt-4 text-white font-medium text-sm group-hover:translate-x-1 transition-transform">
              Create lesson plan →
            </div>
          </button>
        )}

        {/* Student card — only for students */}
        {!isTeacher && (
          <button
            onClick={() => setMode("student")}
            className="group bg-black/20 border border-white/20 hover:bg-black/30 hover:border-white/40 rounded-2xl p-8 text-left transition-all duration-200 cursor-pointer"
          >
            <div className="text-4xl mb-4">🎓</div>
            <h2 className="text-xl font-semibold text-white mb-2">Ask a Doubt</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Ask anything from your {user.class} curriculum. Get clear explanations, solved examples, and practice questions.
            </p>
            <div className="mt-4 text-white font-medium text-sm group-hover:translate-x-1 transition-transform">
              Start learning →
            </div>
          </button>
        )}

        <Link
          href="/reels"
          className="group md:col-span-2 bg-black/20 border border-white/20 hover:bg-black/30 hover:border-white/40 rounded-2xl p-8 text-left transition-all duration-200 flex items-center gap-6"
        >
          <div className="text-5xl flex-shrink-0">🎬</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-white mb-1">Study Reels</h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Scroll through short video and image lessons from your teachers — just like Instagram Reels, but for your CBSE curriculum.
            </p>
          </div>
          <div className="text-white font-medium text-sm group-hover:translate-x-1 transition-transform flex-shrink-0">
            Watch →
          </div>
        </Link>
      </div>

      <p className="text-white/40 text-xs mt-12">
        ZUPLERNO • All Campuses
      </p>
    </div>
  );
}

function ChatPage({ mode, goHome, user }: { mode: "teacher" | "student"; goHome: () => void; user: SessionUser }) {
  const [selectedClass, setSelectedClass] = useState(
    mode === "student" && user.class ? user.class : ""
  );
  const [selectedSubject, setSelectedSubject] = useState(
    mode === "teacher" && user.subject ? user.subject : ""
  );
  const [selectedChapter, setSelectedChapter] = useState("");
  const [chapterSearch, setChapterSearch] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [configDone, setConfigDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isTeacher = mode === "teacher";

  const subjects = selectedClass ? getSubjects(selectedClass) : [];
  const chapters =
    selectedClass && selectedSubject
      ? getChapters(selectedClass, selectedSubject)
      : [];
  const filteredChapters = chapterSearch
    ? chapters.filter((c) =>
        c.toLowerCase().includes(chapterSearch.toLowerCase())
      )
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
    setConfigDone(true);

    const chapterPart = selectedChapter
      ? ", Chapter: **" + selectedChapter + "**"
      : "";

    const greeting = isTeacher
      ? "I am ready to help you create a lesson plan for **" +
        selectedClass +
        "** — **" +
        selectedSubject +
        "**" +
        chapterPart +
        ".\n\nJust say \"Generate lesson plan\" to get a full structured plan, or tell me what specific type you want (e.g., \"40-minute introductory lesson\", \"revision class\", \"project-based lesson\")."
      : "Hi! I am your CBSE/NCERT tutor for **" +
        selectedClass +
        "** — **" +
        selectedSubject +
        "**" +
        chapterPart +
        ".\n\nWhat would you like to understand? Ask any question from your curriculum!";

    setMessages([{ role: "assistant", content: greeting }]);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const contextPrefix = selectedChapter
      ? "[Context: " +
        selectedClass +
        ", " +
        selectedSubject +
        ", Chapter: " +
        selectedChapter +
        "]\n\n"
      : "";

    const apiMessages = newMessages.map((m, i) =>
      i === newMessages.length - 1 && m.role === "user"
        ? { role: m.role, content: contextPrefix + m.content }
        : { role: m.role, content: m.content }
    );

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          mode,
          cls: selectedClass,
          subject: selectedSubject,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Error: " + (err.error || "Something went wrong. Please try again."),
          },
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
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              assistantText += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantText,
                };
                return updated;
              });
            }
            if (parsed.error) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: "Error: " + parsed.error,
                };
                return updated;
              });
            }
          } catch {
            // skip malformed lines
          }
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

  if (!configDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-lg">
          <button
            onClick={goHome}
            className="text-white/70 hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors cursor-pointer"
          >
            ← Back
          </button>

          <div className="text-center mb-8">
            <div className="text-4xl mb-3">{isTeacher ? "📚" : "🎓"}</div>
            <h2 className="text-2xl font-bold text-white">
              {isTeacher ? "Teacher Mode" : "Student Mode"}
            </h2>
            <p className="text-white/70 text-sm mt-2">
              {isTeacher
                ? "Select class, subject, and chapter to generate a lesson plan"
                : "Select your class and subject to start learning"}
            </p>
          </div>

          <div className="space-y-4">
            {/* Class selector */}
            <div>
              <label className="block text-white font-medium mb-2 text-sm">
                Class
              </label>
              <div className="grid grid-cols-4 gap-2">
                {CLASS_LIST.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => handleClassChange(cls)}
                    className={
                      "py-2 px-1 rounded-lg text-sm font-medium transition-all border cursor-pointer " +
                      (selectedClass === cls
                        ? isTeacher
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-emerald-600 border-emerald-500 text-white"
                        : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")
                    }
                  >
                    {cls.replace("Class ", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject selector */}
            {subjects.length > 0 && (
              <div>
                <label className="block text-white font-medium mb-2 text-sm">
                  Subject
                </label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => handleSubjectChange(sub)}
                      className={
                        "py-1.5 px-3 rounded-lg text-sm transition-all border cursor-pointer " +
                        (selectedSubject === sub
                          ? isTeacher
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")
                      }
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chapter selector */}
            {chapters.length > 0 && (
              <div>
                <label className="block text-white font-medium mb-2 text-sm">
                  Chapter{" "}
                  <span className="text-white/50 font-normal">(optional)</span>
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
                      onClick={() =>
                        setSelectedChapter(selectedChapter === ch ? "" : ch)
                      }
                      className={
                        "py-1 px-2.5 rounded-lg text-xs transition-all border text-left cursor-pointer " +
                        (selectedChapter === ch
                          ? isTeacher
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-black/15 border-white/20 text-white hover:border-white/40 hover:bg-black/25")
                      }
                    >
                      <span className="text-white/40 mr-1">Ch {i + 1}</span>
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start button */}
            <button
              onClick={startChat}
              disabled={!selectedClass || !selectedSubject}
              className={
                "w-full py-3 rounded-xl font-semibold text-white transition-all mt-2 " +
                (selectedClass && selectedSubject
                  ? isTeacher
                    ? "bg-blue-600 hover:bg-blue-500 cursor-pointer"
                    : "bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
                  : "bg-white/10 cursor-not-allowed opacity-50")
              }
            >
              {isTeacher
                ? "Start Creating Lesson Plan →"
                : "Start Learning →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <button
          onClick={goHome}
          className="text-slate-400 hover:text-white transition-colors text-sm cursor-pointer"
        >
          ← Home
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-lg">{isTeacher ? "📚" : "🎓"}</span>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {selectedClass} • {selectedSubject}
              {selectedChapter && " • " + selectedChapter}
            </p>
            <p className="text-slate-500 text-xs">
              {isTeacher ? "Teacher Mode" : "Student Mode"}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setConfigDone(false);
            setMessages([]);
            setSelectedChapter("");
          }}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap cursor-pointer"
        >
          Change →
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} isTeacher={isTeacher} />
        ))}
        {loading &&
          messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-white/10 bg-slate-900/80 backdrop-blur">
        {isTeacher && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {[
              "Generate lesson plan",
              "Make it shorter",
              "Add group activity",
              "Add assessment ideas",
              "Simplify for slow learners",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setInput(suggestion);
                  textareaRef.current?.focus();
                }}
                className="whitespace-nowrap text-xs px-3 py-1 bg-black/15 border border-white/20 rounded-full text-white/70 hover:text-white hover:border-white/40 transition-all cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isTeacher
                ? "Ask to generate or tweak the lesson plan..."
                : "Ask any doubt from your curriculum..."
            }
            rows={1}
            className="flex-1 bg-black/20 border border-white/20 focus:border-white/40 rounded-xl px-4 py-3 text-white text-sm placeholder-white/40 outline-none resize-none transition-colors"
            style={{ maxHeight: "120px", overflowY: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height =
                Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className={
              "p-3 rounded-xl transition-all " +
              (input.trim() && !loading
                ? isTeacher
                  ? "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                : "bg-white/5 text-slate-500 cursor-not-allowed")
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <p className="text-white/40 text-xs mt-1.5 text-center">
          Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  isTeacher,
}: {
  msg: Message;
  isTeacher: boolean;
}) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className={
            "max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white " +
            (isTeacher ? "bg-blue-600" : "bg-emerald-600")
          }
        >
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
        <h3
          key={i}
          className="text-base font-bold text-gray-900 mt-3 mb-1"
        >
          {renderInline(line.slice(4))}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="text-lg font-bold text-gray-900 mt-4 mb-1"
        >
          {renderInline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={i}
          className="text-xl font-bold text-gray-900 mt-4 mb-2"
        >
          {renderInline(line.slice(2))}
        </h1>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const listItems: React.ReactNode[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("* "))
      ) {
        listItems.push(
          <li key={i}>{renderInline(lines[i].slice(2))}</li>
        );
        i++;
      }
      elements.push(
        <ul
          key={"ul-" + i}
          className="list-disc list-inside space-y-0.5 my-1 text-gray-700"
        >
          {listItems}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        listItems.push(
          <li key={i}>
            {renderInline(lines[i].replace(/^\d+\. /, ""))}
          </li>
        );
        i++;
      }
      elements.push(
        <ol
          key={"ol-" + i}
          className="list-decimal list-inside space-y-0.5 my-1 text-gray-700"
        >
          {listItems}
        </ol>
      );
      continue;
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="my-0.5">
          {renderInline(line)}
        </p>
      );
    }

    i++;
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-gray-900 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
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
