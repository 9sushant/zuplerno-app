"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { CLASS_LIST, getSubjects, getChapters } from "@/lib/ncert-chapters";

type UploadState = "pin" | "form" | "uploading" | "success" | "error";

export default function UploadPage() {
  const [state, setState] = useState<UploadState>("pin");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_SIZE = 10 * 1024 * 1024;

  const subjects = selectedClass ? getSubjects(selectedClass) : [];
  const chapters =
    selectedClass && selectedSubject
      ? getChapters(selectedClass, selectedSubject)
      : [];

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.length < 4) {
      setPinError("PIN must be at least 4 characters.");
      return;
    }
    setPinError("");
    // Verify PIN with the server before allowing access to the form
    try {
      const fd = new FormData();
      fd.append("pin", pin);
      fd.append("__pin_check__", "1");
      const res = await fetch("/api/reels/upload", { method: "POST", body: fd });
      if (res.status === 401) {
        setPinError("Wrong PIN. Access denied.");
        return;
      }
    } catch {
      setPinError("Could not verify PIN. Please try again.");
      return;
    }
    setState("form");
  }

  function handleFileSelect(f: File) {
    if (f.size > MAX_SIZE) {
      alert("File is larger than 10 MB. Please choose a smaller file.");
      return;
    }
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowed.includes(f.type)) {
      alert("Unsupported format. Please use MP4, WebM, MOV, JPG, PNG, GIF, or WebP.");
      return;
    }
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, []);

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  function removeFile() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClassChange(cls: string) {
    setSelectedClass(cls);
    setSelectedSubject("");
    setSelectedChapter("");
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title || !selectedClass || !selectedSubject) return;

    setState("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.append("pin", pin);
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("class", selectedClass);
    formData.append("subject", selectedSubject);
    formData.append("chapter", selectedChapter);

    // Use XHR for upload progress
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    });

    xhr.open("POST", "/api/reels/upload");

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        setState("success");
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          setErrorMsg(body.error || "Upload failed.");
        } catch {
          setErrorMsg("Upload failed.");
        }
        setState("error");
      }
    };

    xhr.onerror = () => {
      setErrorMsg("Network error. Please try again.");
      setState("error");
    };

    xhr.send(formData);
  }

  // ── PIN screen ──
  if (state === "pin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <Link href="/reels" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-8 transition-colors">
            ← Study Reels
          </Link>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Teacher Access</h1>
            <p className="text-slate-400 text-sm mt-2">Enter your teacher PIN to upload content</p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              autoFocus
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.5em] placeholder-slate-600 outline-none transition-colors"
            />
            {pinError && (
              <p className="text-red-400 text-sm text-center">{pinError}</p>
            )}
            <button
              type="submit"
              disabled={pin.length < 4}
              className={
                "w-full py-3 rounded-xl font-semibold text-white transition-all " +
                (pin.length >= 4
                  ? "bg-blue-600 hover:bg-blue-500 cursor-pointer"
                  : "bg-white/10 opacity-50 cursor-not-allowed")
              }
            >
              Continue →
            </button>
          </form>

          <p className="text-slate-600 text-xs text-center mt-6">
            Default PIN is set in .env.local (TEACHER_PIN)
          </p>
        </div>
      </div>
    );
  }

  // ── Uploading screen ──
  if (state === "uploading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                style={{ transition: "stroke-dashoffset 0.3s ease" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
              {progress}%
            </span>
          </div>
          <p className="text-white font-semibold text-lg">Uploading...</p>
          <p className="text-slate-400 text-sm mt-1">Please wait, do not close this page</p>
        </div>
      </div>
    );
  }

  // ── Success screen ──
  if (state === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] flex items-center justify-center px-4">
        <div className="text-center w-full max-w-sm">
          <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Reel Uploaded!</h2>
          <p className="text-slate-400 text-sm mb-8">
            Your content is now live in Study Reels for students to discover.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/reels"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-center transition-colors"
            >
              View Study Reels
            </Link>
            <button
              onClick={() => {
                setState("form");
                setTitle("");
                setDescription("");
                setFile(null);
                setPreview(null);
                setSelectedClass("");
                setSelectedSubject("");
                setSelectedChapter("");
              }}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-colors cursor-pointer"
            >
              Upload Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Error screen ──
  if (state === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] flex items-center justify-center px-4">
        <div className="text-center w-full max-w-sm">
          <div className="w-20 h-20 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upload Failed</h2>
          <p className="text-red-300 text-sm mb-8 bg-red-900/20 rounded-xl px-4 py-3">{errorMsg}</p>
          <button
            onClick={() => setState("form")}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Upload form ──
  const canSubmit = !!file && !!title.trim() && !!selectedClass && !!selectedSubject;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C]">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/reels" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors">
            ← Study Reels
          </Link>
          <span className="text-white font-semibold">Upload Reel</span>
          <div className="w-20" />
        </div>

        <form onSubmit={handleUpload} className="space-y-5">
          {/* ── Drop zone ── */}
          {!file ? (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={
                "border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center cursor-pointer transition-all " +
                (isDragging
                  ? "border-blue-400 bg-blue-500/10"
                  : "border-white/15 hover:border-white/30 hover:bg-white/5")
              }
            >
              <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">
                {isDragging ? "Drop it here!" : "Drag & drop or tap to browse"}
              </p>
              <p className="text-slate-500 text-sm">
                Video (MP4, WebM, MOV) or Image (JPG, PNG, GIF, WebP)
              </p>
              <p className="text-slate-600 text-xs mt-1">Max 10 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,image/gif,image/webp"
                onChange={onFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            /* ── File preview ── */
            <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10">
              {file.type.startsWith("video/") ? (
                <video
                  src={preview!}
                  className="w-full max-h-64 object-contain bg-black"
                  controls
                  muted
                />
              ) : (
                <img
                  src={preview!}
                  alt="preview"
                  className="w-full max-h-64 object-contain"
                />
              )}
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={removeFile}
                  className="w-8 h-8 bg-black/70 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-slate-400 text-xs truncate">{file.name}</span>
                <span className="text-slate-500 text-xs ml-2 flex-shrink-0">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>
          )}

          {/* ── Title ── */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Photosynthesis explained in 60 seconds"
              maxLength={80}
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none transition-colors"
            />
          </div>

          {/* ── Description ── */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Description <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a short explanation or key points..."
              rows={3}
              maxLength={300}
              className="w-full bg-white/5 border border-white/10 focus:border-blue-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 outline-none transition-colors resize-none"
            />
          </div>

          {/* ── Class selector ── */}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">
              Class <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {CLASS_LIST.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => handleClassChange(cls)}
                  className={
                    "py-2 px-1 rounded-lg text-sm font-medium transition-all border cursor-pointer " +
                    (selectedClass === cls
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-white/5 border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/10")
                  }
                >
                  {cls.replace("Class ", "")}
                </button>
              ))}
            </div>
          </div>

          {/* ── Subject selector ── */}
          {subjects.length > 0 && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Subject <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSelectedSubject(sub);
                      setSelectedChapter("");
                    }}
                    className={
                      "py-1.5 px-3 rounded-lg text-sm transition-all border cursor-pointer " +
                      (selectedSubject === sub
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-white/5 border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/10")
                    }
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Chapter selector ── */}
          {chapters.length > 0 && (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                Chapter <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {chapters.map((ch, i) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() =>
                      setSelectedChapter(selectedChapter === ch ? "" : ch)
                    }
                    className={
                      "py-1 px-2.5 rounded-lg text-xs transition-all border cursor-pointer text-left " +
                      (selectedChapter === ch
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-white/5 border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/10")
                    }
                  >
                    <span className="text-slate-500 mr-1">Ch {i + 1}</span>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={
              "w-full py-4 rounded-xl font-bold text-white text-base transition-all mt-2 " +
              (canSubmit
                ? "bg-blue-600 hover:bg-blue-500 active:scale-[0.98] cursor-pointer shadow-lg shadow-blue-900/40"
                : "bg-white/10 opacity-50 cursor-not-allowed")
            }
          >
            Publish Reel
          </button>

          {!canSubmit && (
            <p className="text-slate-500 text-xs text-center -mt-2">
              {!file ? "Add a file • " : ""}
              {!title.trim() ? "Add a title • " : ""}
              {!selectedClass ? "Select class • " : ""}
              {!selectedSubject ? "Select subject" : ""}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
