"use client";

import { useState, useEffect } from "react";
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
  created_at: string;
};

export default function LikedReelsPage() {
  const [likedReels, setLikedReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const likedIds: string[] = JSON.parse(localStorage.getItem("liked_reel_ids") || "[]");

    if (likedIds.length === 0) {
      setLoading(false);
      return;
    }

    fetch("/api/reels")
      .then((r) => r.json())
      .then((all: Reel[]) => {
        // Keep order from liked_reel_ids (most recently liked first)
        const map = new Map(all.map((r) => [r.id, r]));
        const filtered = likedIds.map((id) => map.get(id)).filter(Boolean) as Reel[];
        setLikedReels(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function unlike(id: string) {
    localStorage.removeItem("reel_liked_" + id);
    const ids: string[] = JSON.parse(localStorage.getItem("liked_reel_ids") || "[]");
    localStorage.setItem("liked_reel_ids", JSON.stringify(ids.filter((i) => i !== id)));
    setLikedReels((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C]">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/reels"
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/15 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <h1 className="text-white font-bold text-lg">Liked Reels</h1>
            {likedReels.length > 0 && (
              <span className="text-slate-400 text-sm">({likedReels.length})</span>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && likedReels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">🤍</div>
            <h2 className="text-white font-semibold text-lg mb-2">No liked reels yet</h2>
            <p className="text-slate-400 text-sm mb-6 max-w-xs">
              Tap the heart on any reel to save it here for quick access later.
            </p>
            <Link
              href="/reels"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
            >
              Browse Reels
            </Link>
          </div>
        )}

        {/* Liked reels grid */}
        {!loading && likedReels.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {likedReels.map((reel) => (
              <LikedReelCard key={reel.id} reel={reel} onUnlike={() => unlike(reel.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LikedReelCard({ reel, onUnlike }: { reel: Reel; onUnlike: () => void }) {
  const isVideo = reel.mimetype.startsWith("video/");

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] group">
      {/* Thumbnail */}
      {isVideo ? (
        <video
          src={reel.blob_url}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          src={reel.blob_url}
          alt={reel.title}
          className="w-full h-full object-cover"
          draggable={false}
        />
      )}

      {/* Gradient */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)" }}
      />

      {/* Video badge */}
      {isVideo && (
        <div className="absolute top-2 left-2 bg-black/50 rounded-md px-1.5 py-0.5 flex items-center gap-1">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}

      {/* Unlike button */}
      <button
        onClick={onUnlike}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </button>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <div className="flex gap-1 flex-wrap mb-1">
          <span className="text-xs bg-blue-600/80 text-white px-1.5 py-0.5 rounded-md font-medium">
            {reel.class.replace("Class ", "Cl.")}
          </span>
          <span className="text-xs bg-violet-600/80 text-white px-1.5 py-0.5 rounded-md font-medium truncate max-w-[80px]">
            {reel.subject.split(" ")[0]}
          </span>
        </div>
        <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{reel.title}</p>
      </div>
    </div>
  );
}
