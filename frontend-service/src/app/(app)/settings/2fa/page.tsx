"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Smartphone, Copy, Check, ArrowRight,
  RefreshCw, ShieldOff, Shield,
} from "lucide-react";
import { createClient } from "@/core/auth/supabase-client";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";

type Step = "checking" | "disabled" | "setup" | "verify" | "enabled";

export default function TwoFactorAuthPage() {
  const [step, setStep]             = useState<Step>("checking");
  const [factorId, setFactorId]     = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [qrSvg, setQrSvg]           = useState<string | null>(null);
  const [secret, setSecret]         = useState<string | null>(null);
  const [code, setCode]             = useState("");
  const [copied, setCopied]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Check current MFA status on load
  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const totpFactor = data?.totp?.find(f => f.status === "verified");
      if (totpFactor) {
        setFactorId(totpFactor.id);
        setStep("enabled");
      } else {
        setStep("disabled");
      }
    }
    check();
  }, []);

  async function startEnrollment() {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "D-Lite Authenticator",
    });

    if (enrollError || !data) {
      setError(enrollError?.message ?? "Failed to start 2FA setup. Make sure TOTP is enabled in your Supabase project.");
      setLoading(false);
      return;
    }

    setFactorId(data.id);
    setQrSvg(data.totp.qr_code);
    setSecret(data.totp.secret);

    // Pre-create challenge
    const { data: ch } = await supabase.auth.mfa.challenge({ factorId: data.id });
    if (ch) setChallengeId(ch.id);

    setLoading(false);
    setStep("setup");
  }

  async function handleVerify() {
    if (!factorId || !challengeId || code.length !== 6) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (verifyError) {
      setError(verifyError.message);
      // Refresh challenge for retry
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

  async function handleDisable() {
    if (!factorId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
    if (unenrollError) {
      setError(unenrollError.message);
      setLoading(false);
      return;
    }
    setFactorId(null);
    setQrSvg(null);
    setSecret(null);
    setLoading(false);
    setStep("disabled");
  }

  function copySecret() {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl"
    >
      <SettingsHeader
        title="Two-Factor Authentication"
        description="Add an extra layer of security using Google Authenticator or Authy."
      />

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 rounded-2xl px-4 py-3 text-sm flex items-start gap-2"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--danger)" }}
          >
            ⚠ {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* ── Checking ── */}
        {step === "checking" && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: "var(--brand-text)", borderTopColor: "transparent" }} />
          </div>
        )}

        {/* ── Disabled (intro) ── */}
        {step === "disabled" && (
          <div className="flex flex-col items-center text-center py-14 px-8 gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--row-hover-bg)" }}>
              <Shield size={28} style={{ color: "var(--text-muted)" }} />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                2FA is not enabled
              </h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Protect your account with Google Authenticator or Authy.
                You&apos;ll need to enter a 6-digit code each time you sign in.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startEnrollment}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white disabled:opacity-60"
              style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Setting up…</>
                : <><ShieldCheck size={16} /> Enable 2FA</>
              }
            </motion.button>
          </div>
        )}

        {/* ── Setup (QR) ── */}
        {step === "setup" && (
          <div className="p-6 flex flex-col gap-5">
            <div className="text-center">
              <h3 className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>
                Step 1 — Scan QR Code
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Open <strong>Google Authenticator</strong> or <strong>Authy</strong> → tap + → Scan QR code
              </p>
            </div>

            {/* QR — inject width/height into SVG so it fills the white box */}
            <div className="flex justify-center">
              {qrSvg && (
                <div
                  className="w-56 h-56 rounded-2xl overflow-hidden bg-white p-3 shadow-lg"
                  dangerouslySetInnerHTML={{
                    __html: qrSvg.replace(
                      "<svg",
                      '<svg style="width:100%;height:100%;display:block;"'
                    ),
                  }}
                />
              )}
            </div>

            {/* Manual key */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "var(--text-muted)" }}>
                Can&apos;t scan? Enter key manually
              </p>
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: "var(--row-hover-bg)", border: "1px solid var(--border)" }}>
                <code className="text-xs font-mono flex-1 break-all" style={{ color: "var(--text-primary)" }}>
                  {secret}
                </code>
                <button onClick={copySecret} className="shrink-0 p-1 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ color: copied ? "var(--success)" : "var(--text-muted)" }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={startEnrollment}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                style={{ background: "var(--row-hover-bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <RefreshCw size={13} /> Refresh
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setStep("verify")}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
                style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
              >
                Continue <ArrowRight size={14} />
              </motion.button>
            </div>
          </div>
        )}

        {/* ── Verify (enter code) ── */}
        {step === "verify" && (
          <div className="p-6 flex flex-col gap-5">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--grad-brand)" }}>
                <Smartphone size={24} className="text-white" />
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>
                Step 2 — Enter 6-digit code
              </h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                From your Google Authenticator or Authy app
              </p>
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
              className="w-full rounded-xl px-4 py-3 text-center text-2xl font-mono outline-none transition-all"
              style={{
                background: "var(--input-bg)",
                border: "1.5px solid var(--input-border)",
                color: "var(--input-text)",
                letterSpacing: "0.4em",
              }}
              onFocus={e => (e.target.style.borderColor = "var(--input-border-focus)")}
              onBlur={e => (e.target.style.borderColor = "var(--input-border)")}
            />

            <div className="flex gap-3">
              <button onClick={() => { setStep("setup"); setCode(""); setError(null); }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                style={{ background: "var(--row-hover-bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                Back
              </button>
              <motion.button
                whileHover={code.length === 6 ? { scale: 1.02 } : undefined}
                whileTap={code.length === 6 ? { scale: 0.97 } : undefined}
                onClick={handleVerify}
                disabled={code.length !== 6 || loading}
                className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
              >
                {loading
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                  : <>Verify &amp; Enable <ArrowRight size={14} /></>
                }
              </motion.button>
            </div>
          </div>
        )}

        {/* ── Enabled ── */}
        {step === "enabled" && (
          <div className="flex flex-col items-center text-center py-14 px-8 gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", boxShadow: "0 0 24px rgba(16,185,129,0.4)" }}>
              <ShieldCheck size={28} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                2FA is Active ✓
              </h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Your account is protected. You&apos;ll need your authenticator app each time you sign in.
              </p>
            </div>
            <button
              onClick={handleDisable}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border hover:opacity-80 transition-opacity disabled:opacity-50"
              style={{ color: "var(--danger)", borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}
            >
              {loading
                ? <><span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" /> Disabling…</>
                : <><ShieldOff size={15} /> Disable 2FA</>
              }
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
