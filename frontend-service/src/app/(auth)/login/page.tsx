"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { AuthSplitVisual } from "@/features/auth/components/AuthSplitVisual";
import { SocialButtons } from "@/features/auth/components/SocialButtons";
import { Toggle } from "@/shared/components/Toggle";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { createClient } from "@/core/auth/supabase-client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(searchParams.get("error"));

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check if user has MFA enrolled — if yes, challenge them before dashboard
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
      router.push("/verify-authenticator");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="flex min-h-screen w-full themed-canvas">
      <AuthSplitVisual />

      <div className="flex flex-1 flex-col justify-center px-6 sm:px-12 lg:px-20 relative overflow-y-auto py-12">
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] mx-auto">

          {/* Brand mark */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "var(--grad-brand)" }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight themed-text">D-<span className="brand-grad-text">Lite</span></span>
          </motion.div>

          {/* Heading */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
            <h1 className="text-3xl font-black themed-text mb-1.5">Welcome back 👋</h1>
            <p className="themed-text-3 text-sm">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-semibold hover:underline" style={{ color: "var(--brand-text)" }}>
                Sign up free
              </Link>
            </p>
          </motion.div>

          {/* Google */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
            <SocialButtons />
          </motion.div>

          {/* Divider */}
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="relative my-6 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs themed-text-muted font-medium px-1">or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </motion.div>

          {/* Success / Error Messages */}
          {searchParams.get("signup") === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 rounded-2xl px-4 py-3 text-sm flex items-start gap-2 shadow-sm"
              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "var(--success)" }}
            >
              <ShieldCheck size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Account created! ✨</p>
                <p className="text-xs opacity-90 mt-0.5">You can now sign in with your credentials.</p>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-2xl px-4 py-3 text-sm flex items-start gap-2"
              style={{ background: "rgba(239,68,68,0.22)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--danger)" }}
            >
              <span className="mt-0.5">⚠</span> {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
              <label className="block text-xs font-semibold themed-text-2 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all themed-text"
                style={{
                  background: "var(--input-bg)",
                  border: "1.5px solid var(--input-border)",
                  color: "var(--input-text)",
                }}
                onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
                onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
              />
            </motion.div>

            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold themed-text-2 uppercase tracking-wide">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: "var(--brand-text)" }}>
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none transition-all themed-text"
                  style={{
                    background: "var(--input-bg)",
                    border: "1.5px solid var(--input-border)",
                    color: "var(--input-text)",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
                  onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 themed-text-3 hover:themed-text transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </motion.div>

            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-3">
              <Toggle checked={keepSignedIn} onChange={setKeepSignedIn} />
              <span className="text-sm themed-text-2">Keep me signed in</span>
            </motion.div>

            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.015 } : undefined}
                whileTap={!loading ? { scale: 0.98 } : undefined}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <>Sign in <ArrowRight size={16} /></>
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-center gap-2 mt-6 text-xs themed-text-muted">
            <ShieldCheck size={13} className="text-success" />
            Your account is protected with 2FA
          </motion.div>
        </div>
      </div>
    </div>
  );
}
