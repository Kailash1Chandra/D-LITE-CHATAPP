"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { AuthSplitVisual } from "@/features/auth/components/AuthSplitVisual";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { createClient } from "@/core/auth/supabase-client";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all themed-text"
      style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", color: "var(--input-text)" }}
      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "var(--input-border-focus)"; props.onFocus?.(e); }}
      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "var(--input-border)"; props.onBlur?.(e); }}
    />
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen w-full themed-canvas">
      <AuthSplitVisual />

      <div className="flex flex-1 flex-col justify-center px-6 sm:px-12 lg:px-20 overflow-y-auto py-12 relative">
        <div className="absolute top-5 right-5"><ThemeToggle /></div>

        <div className="w-full max-w-[420px] mx-auto">
          {/* Brand */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "var(--grad-brand)" }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight themed-text">D-<span className="brand-grad-text">Lite</span></span>
          </motion.div>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-5"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", boxShadow: "0 0 24px rgba(16,185,129,0.4)" }}>
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black themed-text mb-1.5">Check your inbox</h2>
                  <p className="text-sm themed-text-3">
                    We sent a reset link to <span className="font-semibold themed-text">{email}</span>.
                    Click the link in the email to reset your password.
                  </p>
                </div>
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "var(--row-hover-bg)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                  >
                    <ArrowLeft size={14} /> Back to sign in
                  </motion.button>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
                  <h2 className="text-3xl font-black themed-text mb-1.5">Forgot password?</h2>
                  <p className="themed-text-3 text-sm">
                    Enter your email and we&apos;ll send you a reset link.{" "}
                    <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--brand-text)" }}>
                      Back to sign in
                    </Link>
                  </p>
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-5 rounded-2xl px-4 py-3 text-sm flex items-start gap-2 overflow-hidden"
                      style={{ background: "rgba(239,68,68,0.22)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--danger)" }}
                    >
                      ⚠ {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                    <label className="block text-xs font-semibold themed-text-2 mb-1.5 uppercase tracking-wide">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
                      <StyledInput
                        type="email" required
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", color: "var(--input-text)", paddingLeft: "2.5rem" }}
                      />
                    </div>
                  </motion.div>

                  <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                    <motion.button
                      type="submit"
                      disabled={loading || !email}
                      whileHover={!loading ? { scale: 1.015 } : undefined}
                      whileTap={!loading ? { scale: 0.98 } : undefined}
                      className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                      style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
                    >
                      {loading ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
                      ) : (
                        <>Send reset link <ArrowRight size={15} /></>
                      )}
                    </motion.button>
                  </motion.div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
