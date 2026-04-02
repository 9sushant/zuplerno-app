"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState(["", "", "", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handlePinInput(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);
    if (digit && index < 7) {
      pinRefs.current[index + 1]?.focus();
    }
  }

  function handlePinKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (pin[index]) {
        const newPin = [...pin];
        newPin[index] = "";
        setPin(newPin);
      } else if (index > 0) {
        pinRefs.current[index - 1]?.focus();
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const pinStr = pin.join("");
    if (pinStr.length !== 8) {
      setError("Please enter all 8 digits of your PIN.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), pin: pinStr }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please try again.");
        setLoading(false);
        return;
      }

      localStorage.setItem("ds_session", JSON.stringify(data.user));
      router.push("/");
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  }

  const pinFilled = pin.join("").length === 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00D4AA] via-[#00C4A0] to-[#009E8C] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg shadow-black/30">
            <img src="/zuplerno-logo.jpg" alt="ZUPLERNO" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-white/60 text-sm mt-1">ZUPLERNO</p>
        </div>

        <form onSubmit={handleLogin} noValidate className="space-y-5">

          {/* Email */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-1.5">
              Email Address
            </label>
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              className="w-full bg-white/20 border border-white/30 focus:border-white/70 rounded-xl px-4 py-3.5 text-white text-sm placeholder-white/40 outline-none transition-colors"
            />
          </div>

          {/* PIN */}
          <div>
            <label className="block text-white/80 text-sm font-medium mb-3">
              8-Digit PIN
              <span className="text-white/40 font-normal ml-2 text-xs">
                (sent by your admin)
              </span>
            </label>

            <div className="flex gap-1.5 justify-between">
              {pin.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { pinRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinInput(i, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  style={{ width: "11%", minWidth: 0 }}
                  className={
                    "aspect-square text-center text-white text-lg font-bold rounded-lg border outline-none transition-all " +
                    (digit
                      ? "bg-white/40 border-white"
                      : "bg-white/20 border-white/30 focus:border-white/70")
                  }
                />
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-2">
              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={
              "w-full py-4 font-bold rounded-xl transition-all text-base mt-1 " +
              (!loading
                ? "bg-white text-[#00A890] hover:bg-white/90 active:scale-[0.98] cursor-pointer shadow-lg shadow-black/20"
                : "bg-white/50 text-white/70 cursor-not-allowed")
            }
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              "Login →"
            )}
          </button>

          <p className="text-white/50 text-sm text-center pt-1">
            New here?{" "}
            <Link href="/register" className="text-white hover:text-white/80 transition-colors font-medium">
              Register your account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
