"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, ShieldCheck, KeyRound, Eye, EyeOff,
  CheckCircle2, ArrowRight,
} from "lucide-react";
import { AuthSplitVisual } from "@/features/auth/components/AuthSplitVisual";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { PasswordStrengthMeter } from "@/features/auth/components/PasswordStrengthMeter";
import { createClient } from "@/core/auth/supabase-client";

type Step = "checking" | "verify2fa" | "newpassword" | "done";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
      style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", color: "var(--input-text)" }}
      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "var(--input-border-focus)"; props.onFocus?.(e); }}
      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "var(--input-border)"; props.onBlur?.(e); }}
    />
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep]             = useState<Step>("checking");
  const [factorId, setFactorId]     = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [totpCode, setTotpCode]     = useState("");
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showCf, setShowCf]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // On mount: check if user has 2FA enabled
  useEffect(() => {
    async function check() {
      const supabase = createClient();
      try {
        const { data } = await supabase.auth.mfa.listFactors();
        const verified = data?.totp?.find(f => f.status === "verified");
        if (verified) {
          setFactorId(verified.id);
          // Pre-create challenge
          const { data: ch } = await supabase.auth.mfa.challenge({ factorId: verified.id });
          if (ch) setChallengeId(ch.id);
          setStep("verify2fa");
        } else {
          setStep("newpassword");
        }
      } catch {
        setStep("newpassword");
      }
    }
    check();
  }, []);

  // Step 1: Verify TOTP
  async function handleVerify() {
    if (!factorId || !challengeId || totpCode.length !== 6) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code: totpCode });
    if (verifyError) {
      setError(verifyError.message);
      // Refresh challenge for retry
      const { data: ch } = await supabase.auth.mfa.challenge({ factorId });
      if (ch) setChallengeId(ch.id);
      setTotpCode("");
      setLoading(false);
      return;
    }
    setLoading(false);
    setStep("newpassword");
  }

  // Step 2: Save new password
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    setStep("done");
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
                ⚠ {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* ── Checking ── */}
            {step === "checking" && (
              <motion.div key="checking" className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 animate-spin"
                  style={{ borderColor: "var(--brand-text)", borderTopColor: "transparent" }} />
              </motion.div>
            )}

            {/* ── 2FA Verify ── */}
            {step === "verify2fa" && (
              <motion.div key="2fa" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--grad-brand)" }}>
                      <ShieldCheck size={17} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black themed-text">Verify identity</h2>
                  </div>
                  <p className="text-sm themed-text-3">
                    Your account has 2FA enabled. Enter the 6-digit code from your authenticator app to continue.
                  </p>
                </div>

                {/* Steps */}
                <div className="flex items-center gap-2 mb-8">
                  {["Verify 2FA", "New password"].map((s, i) => {
                    const isActive = i === 0;
                    return (
                      <div key={s} className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              background: isActive ? "var(--grad-brand)" : "var(--surface)",
                              color: isActive ? "#fff" : "var(--text-muted)",
                              border: isActive ? "none" : "1.5px solid var(--border)",
                            }}>{i + 1}</div>
                          <span className="text-xs font-semibold" style={{ color: isActive ? "var(--brand-text)" : "var(--text-muted)" }}>{s}</span>
                        </div>
                        {i < 1 && <div className="w-8 h-px" style={{ background: "var(--border)" }} />}
                      </div>
                    );
                  })}
                </div>

                <div
                  className="rounded-2xl p-6 flex flex-col items-center gap-5 mb-6"
                  style={{ background: "var(--surface)", border: "1.5px solid var(--border)" }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--grad-brand)" }}>
                    <ShieldCheck size={26} className="text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold themed-text mb-1">Enter authenticator code</h3>
                    <p className="text-xs themed-text-3">Open Google Authenticator or Authy</p>
                  </div>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoFocus
                    value={totpCode}
                    onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={e => e.key === "Enter" && totpCode.length === 6 && handleVerify()}
                    placeholder="000000"
                    className="w-full rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] outline-none transition-all"
                    style={{
                      background: "var(--input-bg)", border: "1.5px solid var(--input-border)",
                      color: "var(--input-text)", letterSpacing: "0.4em",
                    }}
                    onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
                    onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
                  />
                </div>

                <motion.button
                  whileHover={totpCode.length === 6 ? { scale: 1.015 } : undefined}
                  whileTap={totpCode.length === 6 ? { scale: 0.98 } : undefined}
                  onClick={handleVerify}
                  disabled={totpCode.length !== 6 || loading}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                    : <>Verify &amp; Continue <ArrowRight size={15} /></>
                  }
                </motion.button>
              </motion.div>
            )}

            {/* ── New Password ── */}
            {step === "newpassword" && (
              <motion.div key="newpw" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--grad-brand)" }}>
                      <KeyRound size={17} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black themed-text">Set new password</h2>
                  </div>
                  <p className="text-sm themed-text-3">Choose a strong password for your account.</p>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold themed-text-2 mb-1.5 uppercase tracking-wide">New password</label>
                    <div className="relative">
                      <StyledInput
                        type={showPw ? "text" : "password"} required
                        placeholder="Create a strong password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", color: "var(--input-text)", paddingRight: "2.5rem" }}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--text-muted)" }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <PasswordStrengthMeter password={password} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold themed-text-2 mb-1.5 uppercase tracking-wide">Confirm password</label>
                    <div className="relative">
                      <StyledInput
                        type={showCf ? "text" : "password"} required
                        placeholder="Repeat your password"
                        value={confirm}
                        onChange={e => setConfirm(e.target.value)}
                        style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", color: "var(--input-text)", paddingRight: "2.5rem", borderColor: confirm && confirm !== password ? "var(--danger)" : undefined }}
                      />
                      <button type="button" onClick={() => setShowCf(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--text-muted)" }}>
                        {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {confirm && confirm !== password && (
                      <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>Passwords don&apos;t match</p>
                    )}
                  </div>

                  <motion.button
                    type="submit"
                    disabled={loading || !password || password !== confirm}
                    whileHover={!loading ? { scale: 1.015 } : undefined}
                    whileTap={!loading ? { scale: 0.98 } : undefined}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
                  >
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                      : <>Save new password <ArrowRight size={15} /></>
                    }
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* ── Done ── */}
            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", boxShadow: "0 0 24px rgba(16,185,129,0.4)" }}>
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black themed-text mb-1.5">Password updated!</h2>
                  <p className="text-sm themed-text-3">Your password has been changed successfully. You can now sign in with your new password.</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/dashboard")}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
                >
                  Go to Dashboard <ArrowRight size={15} />
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
