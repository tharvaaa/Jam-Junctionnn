import React, { useState } from "react";
import { Lock, KeyRound, ShieldAlert, Eye, EyeOff, Music, ArrowRight, UserCheck } from "lucide-react";
import InteractiveBackground from "./InteractiveBackground";

interface LoginPageProps {
  onLogin: () => void;
}

export const FIXED_USERNAME = "The Jam Junction";
export const FIXED_PASSWORD = "Nokia@12345";

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanPassword = password.trim();

      if (cleanPassword === FIXED_PASSWORD) {
        if (rememberMe) {
          localStorage.setItem("jam_junction_auth", "true");
        } else {
          sessionStorage.setItem("jam_junction_auth", "true");
        }
        setIsLoading(false);
        onLogin();
      } else {
        setIsLoading(false);
        setError("Incorrect security password. Please re-enter.");
      }
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-[#0B0B0F] text-[#F5F5F7] flex flex-col justify-between relative selection:bg-purple-500 selection:text-white overflow-hidden font-sans">
      <InteractiveBackground />

      {/* Top subtle bar */}
      <header className="relative z-10 px-6 py-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <Music className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-black uppercase tracking-wider text-white">
            JAM JUNCTION
          </span>
        </div>
      </header>

      {/* Main Authentication Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md">
          {/* Brand Heading */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-widest text-white drop-shadow-lg select-none mb-2">
              JAM JUNCTION
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
              <Lock className="h-3.5 w-3.5 text-purple-400" />
              <span>Operator Authenticator</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-[#14141B]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden transition-all duration-300 hover:border-purple-500/30">
            {/* Top accent glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

            <div className="mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-purple-400" />
                Access Verification
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Enter your authorized credentials to manage bookings, track revenue, and dispatch live studio alerts.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <ShieldAlert className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input (Locked / Non-editable) */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-mono flex items-center justify-between">
                  <span>Username</span>
                  <span className="text-[10px] text-gray-500 font-normal flex items-center gap-1">
                    <Lock className="h-2.5 w-2.5" /> Locked
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={FIXED_USERNAME}
                    readOnly
                    tabIndex={-1}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-gray-200 text-sm outline-none font-mono cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 font-mono">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter studio password"
                    className="w-full pl-10 pr-11 py-3 bg-black/60 border border-white/10 focus:border-purple-500 rounded-xl text-white text-sm outline-none transition-colors duration-200 font-mono placeholder:text-gray-600 tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-400 hover:text-gray-200">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded bg-black/60 border-white/20 text-purple-600 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span className="text-[11px]">Remember on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3.5 px-4 rounded-xl font-bold text-sm uppercase tracking-wider text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Studio Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center border-t border-white/5 bg-black/40 backdrop-blur-md">
        <p className="text-[11px] text-gray-500 font-mono">
          JAM JUNCTION &copy; {new Date().getFullYear()} &bull; Professional Audio Recording & Jamming Console
        </p>
      </footer>
    </div>
  );
}
