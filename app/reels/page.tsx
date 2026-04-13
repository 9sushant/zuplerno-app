"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

type Reel = {
  id: string;
  title: string;
  description: string;
  class: string;
  subject: string;
  chapter: string;
  filename: string;
  blob_url: string;
  mimetype: string;
  filesize: number;
  created_at: string;
};

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#6366f1",
  Physics: "#0ea5e9",
  Chemistry: "#f59e0b",
  Biology: "#22c55e",
  Science: "#22c55e",
  History: "#ef4444",
  Geography: "#f97316",
  Economics: "#a855f7",
  "Computer Science": "#14b8a6",
  English: "#ec4899",
  Hindi: "#f43f5e",
  Sanskrit: "#84cc16",
};

function subjectColor(subject: string) {
  for (const key of Object.keys(SUBJECT_COLORS)) {
    if (subject.startsWith(key)) return SUBJECT_COLORS[key];
  }
  return "#3b82f6";
}

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [animDir, setAnimDir] = useState<"up" | "down" | null>(null);
  const [animating, setAnimating] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePin, setDeletePin] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetch("/api/reels")
      .then((r) => r.json())
      .then((data: Reel[]) => { setReels(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((data) => { if (data.user?.role === "teacher") setIsTeacher(true); })
      .catch(() => {});
  }, []);

  async function handleDelete() {
    if (deletePin.length < 4) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/reels/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reels[index].id, pin: deletePin }),
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || "Failed to delete."); setDeleting(false); return; }
      const updated = reels.filter((_, i) => i !== index);
      setReels(updated);
      setIndex(Math.min(index, updated.length - 1));
      setShowDeleteModal(false);
      setDeletePin("");
    } catch {
      setDeleteError("Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

  const navigate = useCallback(
    (dir: "up" | "down") => {
      if (animating) return;
      const next = dir === "down" ? index + 1 : index - 1;
      if (next < 0 || next >= reels.length) return;

      // Pause current video immediately to prevent dual audio
      const v = videoRef.current;
      if (v) v.pause();

      setAnimDir(dir);
      setAnimating(true);
      setTimeout(() => {
        setIndex(next);
        setAnimDir(null);
        setAnimating(false);
      }, 300);
    },
    [animating, index, reels.length]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") navigate("down");
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") navigate("up");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const touchY = useRef(0);
  function onTouchStart(e: React.TouchEvent) {
    touchY.current = e.touches[0].clientY;
  }
  function onTouchEnd(e: React.TouchEvent) {
    const delta = touchY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 45) navigate(delta > 0 ? "down" : "up");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-black" style={{ width: "100vw", height: "100dvh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-black text-white px-6" style={{ width: "100vw", height: "100dvh" }}>
        <div className="text-6xl mb-5">🎬</div>
        <h2 className="text-xl font-bold mb-2">No reels yet</h2>
        <p className="text-slate-400 text-sm text-center mb-8 max-w-xs">
          Teachers can upload short lessons from the upload page
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/reels/upload" className="py-3 bg-white text-black font-bold rounded-2xl text-center">
            Upload First Reel
          </Link>
          <Link href="/" className="py-3 bg-white/10 text-white rounded-2xl text-center">
            ← Home
          </Link>
        </div>
      </div>
    );
  }

  const reel = reels[index];
  const translateY = animDir === "down" ? "-100%" : animDir === "up" ? "100%" : "0%";

  return (
    <div
      className="relative overflow-hidden bg-black"
      style={{ width: "100vw", height: "100dvh" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Full-screen media ── */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translateY(${translateY})`,
          transition: animDir ? "transform 0.3s cubic-bezier(0.4,0,0.2,1)" : "none",
        }}
      >
        <ReelMedia reel={reel} muted={muted} videoRef={videoRef} />
      </div>

      {/* ── Top gradient + nav ── */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-10 pb-8"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
      >
        <Link href="/" className="text-white/90 text-sm font-medium">← Home</Link>
        <span className="text-white font-bold text-base tracking-wide">Study Reels</span>
        <div className="flex items-center gap-3">
          <Link href="/reels/liked" className="text-red-400 text-sm font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            Liked
          </Link>
          <Link href="/reels/upload" className="text-white/90 text-sm font-medium">+ Upload</Link>
        </div>
      </div>

      {/* ── Delete PIN modal ── */}
      {showDeleteModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="bg-zinc-900 rounded-2xl p-6 mx-6 w-full max-w-xs">
            <h3 className="text-white font-bold text-base mb-1">Delete Reel</h3>
            <p className="text-zinc-400 text-xs mb-4">Enter your teacher PIN to confirm deletion.</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={deletePin}
              onChange={(e) => { setDeletePin(e.target.value); setDeleteError(""); }}
              placeholder="Teacher PIN"
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 text-sm outline-none mb-3"
              autoFocus
            />
            {deleteError && <p className="text-red-400 text-xs mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletePin(""); setDeleteError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePin.length < 4 || deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: deletePin.length < 4 || deleting ? "#7f1d1d" : "#ef4444", opacity: deletePin.length < 4 || deleting ? 0.5 : 1 }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Right action buttons (absolutely positioned) ── */}
      <div className="absolute right-3 z-30 flex flex-col items-center gap-5" style={{ bottom: "120px" }}>
        <ActionButtons reel={reel} />
        {/* Delete (teacher only) */}
        {isTeacher && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.2)" }}>
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <span className="text-red-400 text-xs">Delete</span>
          </button>
        )}
        {/* Mute */}
        <button
          onClick={() => setMuted((m) => !m)}
          className="flex flex-col items-center gap-1 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            {muted ? (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </div>
          <span className="text-white/70 text-xs">{muted ? "Muted" : "Sound"}</span>
        </button>
        {/* Nav counter */}
        <div className="flex flex-col items-center gap-2 mt-1">
          <button
            onClick={() => navigate("up")}
            disabled={index === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(255,255,255,0.15)", opacity: index === 0 ? 0.3 : 1 }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className="text-white/50 text-xs font-medium">{index + 1}/{reels.length}</span>
          <button
            onClick={() => navigate("down")}
            disabled={index === reels.length - 1}
            className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: "rgba(255,255,255,0.15)", opacity: index === reels.length - 1 ? 0.3 : 1 }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Bottom gradient + info ── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-8 pt-20"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)" }}
      >
        {/* Leave space for right buttons */}
        <div className="pr-20">
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm"
              style={{ background: subjectColor(reel.subject) }}
            >
              {reel.subject.charAt(0)}
            </div>
            <span className="text-white font-semibold text-sm truncate">
              {reel.subject.replace(/\s+/g, "_").toLowerCase()}
            </span>
            <span
              className="text-white text-xs font-bold px-3 py-0.5 rounded-full flex-shrink-0"
              style={{ border: "1.5px solid rgba(255,255,255,0.9)" }}
            >
              Follow
            </span>
          </div>
          <p className="text-white font-semibold text-sm leading-snug mb-1">{reel.title}</p>
          {reel.description && (
            <p className="text-white/70 text-xs leading-relaxed line-clamp-2">{reel.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mt-2">
            <span className="text-xs text-white/60">#{reel.class.replace("Class ", "class")}</span>
            <span className="text-xs text-white/60">#{reel.subject.toLowerCase().replace(/\s+/g, "")}</span>
            {reel.chapter && (
              <span className="text-xs text-white/60">#{reel.chapter.split(":")[0].trim().toLowerCase().replace(/\s+/g, "")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Media player ───────────────────────────────────────
function ReelMedia({
  reel,
  muted,
  videoRef,
}: {
  reel: Reel;
  muted: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const [paused, setPaused] = useState(false);
  const isVideo = reel.mimetype.startsWith("video/");

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    setPaused(false);
  }, [reel.id, videoRef]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPaused(false); }
    else { v.pause(); setPaused(true); }
  }

  return (
    <div className="absolute inset-0 bg-black">
      {isVideo ? (
        <video
          ref={videoRef}
          key={reel.id}
          src={reel.blob_url}
          className="w-full h-full object-cover"
          loop
          muted={muted}
          playsInline
          autoPlay
          onClick={togglePlay}
          style={{ cursor: "pointer" }}
        />
      ) : (
        <img
          key={reel.id}
          src={reel.blob_url}
          alt={reel.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      )}
      {isVideo && paused && (
        <div className="absolute inset-0 flex items-center justify-center" onClick={togglePlay} style={{ cursor: "pointer" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)" }}>
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Like button ────────────────────────────────────────
function ActionButtons({ reel }: { reel: Reel }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bouncing, setBouncing] = useState(false);

  useEffect(() => {
    // Optimistic load from localStorage, then sync with DB
    setLiked(!!localStorage.getItem("reel_liked_" + reel.id));
    setLikeCount(parseInt(localStorage.getItem("reel_likes_" + reel.id) || "0", 10));

    fetch("/api/reels/likes?reel_id=" + reel.id)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.count === "number") setLikeCount(data.count);
        if (typeof data.liked === "boolean") {
          setLiked(data.liked);
          if (data.liked) {
            localStorage.setItem("reel_liked_" + reel.id, "1");
          } else {
            localStorage.removeItem("reel_liked_" + reel.id);
          }
        }
      })
      .catch(() => {});
  }, [reel.id]);

  async function toggleLike() {
    setBouncing(true);
    setTimeout(() => setBouncing(false), 300);

    // Optimistic update
    const next = !liked;
    const newCount = next ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLiked(next);
    setLikeCount(newCount);

    // Sync to DB
    try {
      const res = await fetch("/api/reels/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reel_id: reel.id }),
      });
      const data = await res.json();
      if (typeof data.count === "number") setLikeCount(data.count);
      if (typeof data.liked === "boolean") setLiked(data.liked);
    } catch {
      // revert on failure
      setLiked(!next);
      setLikeCount(likeCount);
    }

    // Keep localStorage in sync for liked page (offline/fast access)
    if (next) {
      localStorage.setItem("reel_liked_" + reel.id, "1");
      const ids: string[] = JSON.parse(localStorage.getItem("liked_reel_ids") || "[]");
      if (!ids.includes(reel.id)) localStorage.setItem("liked_reel_ids", JSON.stringify([reel.id, ...ids]));
    } else {
      localStorage.removeItem("reel_liked_" + reel.id);
      const ids: string[] = JSON.parse(localStorage.getItem("liked_reel_ids") || "[]");
      localStorage.setItem("liked_reel_ids", JSON.stringify(ids.filter((id) => id !== reel.id)));
    }
    localStorage.setItem("reel_likes_" + reel.id, String(newCount));
  }

  return (
    <button onClick={toggleLike} className="flex flex-col items-center gap-1 cursor-pointer">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: liked ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.15)",
          transform: bouncing ? "scale(1.3)" : "scale(1)",
          transition: "transform 0.15s ease, background 0.15s ease",
        }}
      >
        <svg
          className="w-7 h-7"
          fill={liked ? "#ef4444" : "none"}
          stroke={liked ? "#ef4444" : "white"}
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <span className="text-xs font-medium" style={{ color: liked ? "#ef4444" : "rgba(255,255,255,0.8)" }}>
        {likeCount > 0 ? likeCount : "Like"}
      </span>
    </button>
  );
}
