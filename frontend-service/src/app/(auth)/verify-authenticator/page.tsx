"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldCheck, ArrowRight, LogOut } from "lucide-react";
import { createClient } from "@/core/auth/supabase-client";
import { AuthSplitVisual } from "@/features/auth/components/AuthSplitVisual";
import { ThemeToggle } from "@/shared/components/ThemeToggle";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function VerifyAuthenticatorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initChallenge();
  }, []);

  async function initChallenge() {
    setLoading(true);
    const supabase = createClient();

    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
    if (factorError || !factors?.totp?.length) {
      // No MFA set up — go to dashboard directly
      router.replace("/dashboard");
      return;
    }

    const totp = factors.totp.find(f => f.status === "verified");
    if (!totp) {
      router.replace("/dashboard");
      return;
    }

    setFactorId(totp.id);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: totp.id });
    if (challengeError || !challenge) {
      setError("Could not start verification. Please try again.");
      setLoading(false);
      return;
    }

    setChallengeId(challenge.id);
    setLoading(false);
  }

  async function handleVerify() {
    if (!factorId || !challengeId || code.length !== 6) return;
    setVerifying(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code });

    if (verifyError) {
      setError("Invalid code. Please check your authenticator app and try again.");
      setVerifying(false);
      // Refresh challenge
      const { data: challenge } = await supabase.auth.mfa.challenge({ factorId });
      if (challenge) setChallengeId(challenge.id);
      setCode("");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen w-full themed-canvas">
      <AuthSplitVisual />

      <div className="flex flex-1 flex-col justify-center px-6 sm:px-12 lg:px-20 overflow-y-auto py-12 relative">
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px] mx-auto">
          {/* Brand */}
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: "var(--grad-brand)" }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tight themed-text">D-<span className="brand-grad-text">Lite</span></span>
          </motion.div>

          {/* Heading */}
          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--grad-brand)" }}>
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-black themed-text mb-1.5">Two-factor auth</h1>
            <p className="themed-text-3 text-sm">Enter the 6-digit code from your authenticator app to continue.</p>
          </motion.div>

          {/* Error */}
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
                <span className="mt-0.5 flex-shrink-0">⚠</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col items-center gap-4 py-12">
              <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand-text)", borderTopColor: "transparent" }} />
              <p className="text-sm themed-text-3">Loading…</p>
            </motion.div>
          ) : (
            <>
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
                className="rounded-2xl p-6 mb-6"
                style={{ background: "var(--surface)", border: "1.5px solid var(--border)" }}
              >
                <label className="block text-xs font-semibold themed-text-2 mb-3 uppercase tracking-wide">
                  Authenticator code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={e => e.key === "Enter" && code.length === 6 && handleVerify()}
                  placeholder="000000"
                  className="w-full rounded-xl px-4 py-3.5 text-center text-2xl font-mono outline-none transition-all"
                  style={{
                    background: "var(--input-bg)",
                    border: "1.5px solid var(--input-border)",
                    color: "var(--input-text)",
                    letterSpacing: "0.5em",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
                  onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
                />
                <p className="text-xs themed-text-muted mt-3 text-center">
                  Open <strong className="themed-text-2">Google Authenticator</strong> or <strong className="themed-text-2">Authy</strong> to get your code
                </p>
              </motion.div>

              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                <motion.button
                  whileHover={code.length === 6 ? { scale: 1.015 } : undefined}
                  whileTap={code.length === 6 ? { scale: 0.98 } : undefined}
                  onClick={handleVerify}
                  disabled={code.length !== 6 || verifying}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
                >
                  {verifying ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                  ) : (
                    <>Verify &amp; Sign in <ArrowRight size={15} /></>
                  )}
                </motion.button>
              </motion.div>

              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mt-4">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm rounded-xl transition-all hover:opacity-80"
                  style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
                >
                  <LogOut size={14} /> Sign in with a different account
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
