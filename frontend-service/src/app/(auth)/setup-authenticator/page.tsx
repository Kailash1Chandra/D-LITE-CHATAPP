"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldCheck, Smartphone, Copy, Check, ArrowRight, RefreshCw } from "lucide-react";
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

export default function SetupAuthenticatorPage() {
  const router = useRouter();
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"scan" | "verify">("scan");

  useEffect(() => {
    enrollTotp();
  }, []);

  async function enrollTotp() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // Check if user is authenticated first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(
        "Not logged in — if you just registered, please confirm your email first (check your inbox), then log in and set up 2FA from Settings → Security → 2FA."
      );
      setLoading(false);
      return;
    }

    // Unenroll any existing unverified factor before re-enrolling
    const { data: existingFactors } = await supabase.auth.mfa.listFactors();
    const unverified = existingFactors?.totp?.find(f => (f.status as string) === "unverified");
    if (unverified) {
      await supabase.auth.mfa.unenroll({ factorId: unverified.id });
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "D-Lite Authenticator" });
    if (enrollError || !data) {
      setError(
        enrollError?.message?.includes("not enabled")
          ? "MFA not enabled in Supabase — go to Authentication → Factors → enable TOTP."
          : (enrollError?.message ?? "Failed to set up authenticator")
      );
      setLoading(false);
      return;
    }

    setFactorId(data.id);
    setQrSvg(data.totp.qr_code);
    setSecret(data.totp.secret);

    // Pre-create the challenge so it's ready when user enters code
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: data.id });
    if (!challengeError && challengeData) {
      setChallengeId(challengeData.id);
    }

    setLoading(false);
  }

  async function handleVerify() {
    if (!factorId || !challengeId || code.length !== 6) return;
    setVerifying(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code });

    if (verifyError) {
      setError(verifyError.message);
      setVerifying(false);
      // Refresh challenge for retry
      const { data: challengeData } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeData) setChallengeId(challengeData.id);
      setCode("");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--grad-brand)" }}>
                <ShieldCheck size={16} className="text-white" />
              </div>
              <h1 className="text-3xl font-black themed-text">Set up 2FA</h1>
            </div>
            <p className="themed-text-3 text-sm">
              Scan the QR code with <strong className="themed-text-2">Google Authenticator</strong> or <strong className="themed-text-2">Authy</strong> to secure your account.
            </p>
          </motion.div>

          {/* Steps indicator */}
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-2 mb-8">
            {["Scan QR", "Verify"].map((s, i) => {
              const isActive = (i === 0 && step === "scan") || (i === 1 && step === "verify");
              const isDone = i === 0 && step === "verify";
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: isDone ? "var(--success)" : isActive ? "var(--grad-brand)" : "var(--surface)",
                        color: isDone || isActive ? "#fff" : "var(--text-muted)",
                        border: isActive || isDone ? "none" : "1.5px solid var(--border)",
                      }}
                    >
                      {isDone ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: isActive ? "var(--brand-text)" : "var(--text-muted)" }}>{s}</span>
                  </div>
                  {i < 1 && <div className="w-8 h-px" style={{ background: "var(--border)" }} />}
                </div>
              );
            })}
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
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col items-center gap-4 py-12">
              <div className="w-12 h-12 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--brand-text)", borderTopColor: "transparent" }} />
              <p className="text-sm themed-text-3">Setting up your authenticator…</p>
            </motion.div>
          ) : step === "scan" ? (
            <>
              {/* QR Code */}
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
                className="rounded-2xl p-6 flex flex-col items-center gap-4 mb-6"
                style={{ background: "var(--surface)", border: "1.5px solid var(--border)" }}
              >
                {qrSvg && (
                  qrSvg.startsWith("data:") ? (
                    <img
                      src={qrSvg}
                      alt="2FA QR Code"
                      className="w-56 h-56 rounded-2xl bg-white p-3 shadow-lg object-contain"
                    />
                  ) : (
                    <div
                      className="w-56 h-56 rounded-2xl overflow-hidden bg-white p-3 shadow-lg"
                      dangerouslySetInnerHTML={{
                        __html: qrSvg.replace("<svg", '<svg style="width:100%;height:100%;display:block;"'),
                      }}
                    />
                  )
                )}
                <div className="text-center">
                  <p className="text-xs font-semibold themed-text-2 uppercase tracking-wide mb-2">Can&apos;t scan? Use this key</p>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
                    <code className="text-xs font-mono themed-text flex-1 break-all">{secret}</code>
                    <button
                      onClick={copySecret}
                      className="flex-shrink-0 p-1 rounded-lg transition-colors hover:opacity-70"
                      style={{ color: copied ? "var(--success)" : "var(--text-muted)" }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Instructions */}
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible"
                className="rounded-2xl p-4 mb-6 flex items-start gap-3"
                style={{ background: "rgba(var(--brand-rgb, 99,102,241),0.06)", border: "1px solid rgba(var(--brand-rgb, 99,102,241),0.15)" }}
              >
                <Smartphone size={18} className="flex-shrink-0 mt-0.5" style={{ color: "var(--brand-text)" }} />
                <div>
                  <p className="text-sm font-semibold themed-text mb-1">How to set up</p>
                  <ol className="text-xs themed-text-3 space-y-0.5 list-decimal list-inside">
                    <li>Open <strong>Google Authenticator</strong> or <strong>Authy</strong></li>
                    <li>Tap <strong>+</strong> → <strong>Scan QR code</strong></li>
                    <li>Scan the code above</li>
                    <li>Press continue when done</li>
                  </ol>
                </div>
              </motion.div>

              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="flex gap-3">
                <button
                  onClick={enrollTotp}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text-muted)" }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("verify")}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                  style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
                >
                  Continue <ArrowRight size={15} />
                </motion.button>
              </motion.div>

            </>
          ) : (
            <>
              {/* Verify step */}
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible"
                className="rounded-2xl p-6 flex flex-col items-center gap-5 mb-6"
                style={{ background: "var(--surface)", border: "1.5px solid var(--border)" }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--grad-brand)" }}>
                  <ShieldCheck size={26} className="text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-bold themed-text mb-1">Enter the 6-digit code</h3>
                  <p className="text-xs themed-text-3">From your authenticator app</p>
                </div>
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
                  className="w-full rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] outline-none transition-all"
                  style={{
                    background: "var(--input-bg)",
                    border: "1.5px solid var(--input-border)",
                    color: "var(--input-text)",
                    letterSpacing: "0.4em",
                  }}
                  onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
                  onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
                />
              </motion.div>

              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="flex gap-3">
                <button
                  onClick={() => { setStep("scan"); setCode(""); setError(null); }}
                  className="px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                  style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text-muted)" }}
                >
                  Back
                </button>
                <motion.button
                  whileHover={code.length === 6 ? { scale: 1.015 } : undefined}
                  whileTap={code.length === 6 ? { scale: 0.98 } : undefined}
                  onClick={handleVerify}
                  disabled={code.length !== 6 || verifying}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
                >
                  {verifying ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                  ) : (
                    <>Verify &amp; Continue <ArrowRight size={15} /></>
                  )}
                </motion.button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
