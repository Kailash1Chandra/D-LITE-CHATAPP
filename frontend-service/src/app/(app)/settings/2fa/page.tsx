"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Smartphone, Copy, Check, ArrowRight,
  RefreshCw, Shield,
} from "lucide-react";
import { createClient } from "@/core/auth/supabase-client";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";

type Step = "checking" | "disabled" | "setup" | "verify" | "enabled";

export default function TwoFactorAuthPage() {
  const [step, setStep]               = useState<Step>("checking");
  const [factorId, setFactorId]       = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [qrSvg, setQrSvg]             = useState<string | null>(null);
  const [secret, setSecret]           = useState<string | null>(null);
  const [code, setCode]               = useState("");
  const [copied, setCopied]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = data?.totp?.find(f => f.status === "verified");
      if (verified) { setFactorId(verified.id); setStep("enabled"); }
      else setStep("disabled");
    }
    check();
  }, []);

  const isOn = step === "enabled" || step === "setup" || step === "verify";

  async function handleToggle() {
    if (loading || step === "checking") return;
    if (isOn) {
      // Disable
      if (!factorId) return;
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { error: err } = await supabase.auth.mfa.unenroll({ factorId });
      if (err) { setError(err.message); setLoading(false); return; }
      setFactorId(null); setQrSvg(null); setSecret(null);
      setLoading(false);
      setStep("disabled");
    } else {
      // Enable — start enrollment
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const unverified = existing?.totp?.find(f => (f.status as string) === "unverified");
      if (unverified) await supabase.auth.mfa.unenroll({ factorId: unverified.id });

      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp", friendlyName: "D-Lite Authenticator",
      });
      if (enrollError || !data) {
        setError(enrollError?.message ?? "Failed to start 2FA setup.");
        setLoading(false);
        return;
      }
      setFactorId(data.id);
      setQrSvg(data.totp.qr_code);
      setSecret(data.totp.secret);
      const { data: ch } = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (ch) setChallengeId(ch.id);
      setLoading(false);
      setStep("setup");
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: existing } = await supabase.auth.mfa.listFactors();
    const unverified = existing?.totp?.find(f => (f.status as string) === "unverified");
    if (unverified) await supabase.auth.mfa.unenroll({ factorId: unverified.id });
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp", friendlyName: "D-Lite Authenticator",
    });
    if (enrollError || !data) { setError(enrollError?.message ?? "Failed."); setLoading(false); return; }
    setFactorId(data.id);
    setQrSvg(data.totp.qr_code);
    setSecret(data.totp.secret);
    const { data: ch } = await supabase.auth.mfa.challenge({ factorId: data.id });
    if (ch) setChallengeId(ch.id);
    setLoading(false);
  }

  async function handleVerify() {
    if (!factorId || !challengeId || code.length !== 6) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (verifyError) {
      setError(verifyError.message);
      const { data: ch } = await supabase.auth.mfa.challenge({ factorId });
      if (ch) setChallengeId(ch.id);
      setCode("");
      setLoading(false);
      return;
    }
    setCode("");
    setLoading(false);
    setStep("enabled");
  }

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
      <SettingsHeader
        title="Two-Factor Authentication"
        description="Add an extra layer of security using Google Authenticator or Authy."
      />

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            key="err"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 rounded-2xl px-4 py-3 text-sm flex items-start gap-2 overflow-hidden"
            style={{ background: "rgba(239,68,68,0.22)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
          >
            ⚠ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle bar ── */}
      <div
        className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer select-none transition-all"
        style={{ background: "var(--surface)", border: `1.5px solid ${isOn ? "var(--brand-text)" : "var(--border)"}` }}
        onClick={step !== "checking" ? handleToggle : undefined}
      >
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
          style={{
            background: step === "enabled" ? "linear-gradient(135deg,#10b981,#06b6d4)" : isOn ? "var(--grad-brand)" : "var(--row-hover-bg)",
            boxShadow: isOn ? "var(--shadow-glow)" : "none",
          }}
        >
          {step === "enabled"
            ? <ShieldCheck size={20} className="text-white" />
            : <Shield size={20} style={{ color: isOn ? "#fff" : "var(--text-muted)" }} />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold themed-text">
            Two-Factor Authentication
          </p>
          <p className="text-xs mt-0.5" style={{ color: step === "enabled" ? "var(--success)" : isOn ? "var(--brand-text)" : "var(--text-muted)" }}>
            {step === "checking" ? "Checking status…"
              : step === "enabled" ? "Active — your account is protected"
              : step === "setup" ? "Scan the QR code below to continue"
              : step === "verify" ? "Enter the 6-digit code to finish setup"
              : "Off — click to enable"}
          </p>
        </div>

        {/* Toggle pill */}
        {step === "checking" ? (
          <div className="w-5 h-5 rounded-full border-2 animate-spin shrink-0"
            style={{ borderColor: "var(--brand-text)", borderTopColor: "transparent" }} />
        ) : loading ? (
          <div className="w-5 h-5 rounded-full border-2 animate-spin shrink-0"
            style={{ borderColor: "var(--brand-text)", borderTopColor: "transparent" }} />
        ) : (
          <div
            className="relative w-12 h-6 rounded-full shrink-0 transition-colors duration-300"
            style={{ background: isOn ? "var(--brand-text)" : "rgba(128,128,128,0.45)" }}
          >
            <motion.div
              className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
              animate={{ left: isOn ? "calc(100% - 20px)" : "4px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        )}
      </div>

      {/* ── Setup steps (animated) ── */}
      <AnimatePresence>
        {(step === "setup" || step === "verify") && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

              {/* Step tabs */}
              <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
                {["Scan QR", "Verify Code"].map((label, i) => {
                  const isCurrent = (i === 0 && step === "setup") || (i === 1 && step === "verify");
                  const isDone = i === 0 && step === "verify";
                  return (
                    <div key={label} className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors"
                      style={{
                        color: isCurrent ? "var(--brand-text)" : isDone ? "var(--success)" : "var(--text-muted)",
                        borderBottom: isCurrent ? "2px solid var(--brand-text)" : "2px solid transparent",
                      }}>
                      <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: isCurrent ? "var(--grad-brand)" : isDone ? "var(--success)" : "var(--row-hover-bg)", color: isCurrent || isDone ? "#fff" : "var(--text-muted)" }}>
                        {isDone ? <Check size={9} strokeWidth={3} /> : i + 1}
                      </div>
                      {label}
                    </div>
                  );
                })}
              </div>

              {/* Scan QR step */}
              {step === "setup" && (
                <div className="p-5 flex flex-col gap-4">
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                    Open <strong className="themed-text">Google Authenticator</strong> or <strong className="themed-text">Authy</strong> → tap + → Scan QR code
                  </p>
                  <div className="flex justify-center">
                    {qrSvg && (
                      qrSvg.startsWith("data:") ? (
                        <img src={qrSvg} alt="2FA QR Code" className="w-48 h-48 rounded-2xl bg-white p-3 shadow-lg object-contain" />
                      ) : (
                        <div className="w-48 h-48 rounded-2xl overflow-hidden bg-white p-3 shadow-lg"
                          dangerouslySetInnerHTML={{ __html: qrSvg.replace("<svg", '<svg style="width:100%;height:100%;display:block;"') }} />
                      )
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>Can't scan? Enter manually</p>
                    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "var(--row-hover-bg)", border: "1px solid var(--border)" }}>
                      <code className="text-xs font-mono flex-1 break-all" style={{ color: "var(--text-primary)" }}>{secret}</code>
                      <button onClick={copySecret} className="shrink-0 p-1 rounded-lg hover:opacity-70" style={{ color: copied ? "var(--success)" : "var(--text-muted)" }}>
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleRefresh} disabled={loading}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 disabled:opacity-50 transition-opacity"
                      style={{ background: "var(--row-hover-bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setStep("verify")}
                      className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                      style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}>
                      Continue <ArrowRight size={14} />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Verify step */}
              {step === "verify" && (
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "var(--grad-brand)" }}>
                      <Smartphone size={20} className="text-white" />
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Enter the 6-digit code from your authenticator app</p>
                  </div>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoFocus
                    value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={e => e.key === "Enter" && code.length === 6 && handleVerify()}
                    placeholder="000000"
                    className="w-full rounded-xl px-4 py-3 text-center text-2xl font-mono outline-none transition-all"
                    style={{ background: "var(--input-bg)", border: "1.5px solid var(--input-border)", color: "var(--input-text)", letterSpacing: "0.4em" }}
                    onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
                    onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setStep("setup"); setCode(""); setError(null); }}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80"
                      style={{ background: "var(--row-hover-bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                      Back
                    </button>
                    <motion.button
                      whileHover={code.length === 6 ? { scale: 1.02 } : undefined}
                      whileTap={code.length === 6 ? { scale: 0.97 } : undefined}
                      onClick={handleVerify} disabled={code.length !== 6 || loading}
                      className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}>
                      {loading
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                        : <>Verify &amp; Enable <ArrowRight size={14} /></>}
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
