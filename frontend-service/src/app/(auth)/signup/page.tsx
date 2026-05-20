"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mars, Venus, Check, Shield, Lock, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { AuthSplitVisual } from "@/features/auth/components/AuthSplitVisual";
import { AvatarUpload } from "@/features/auth/components/AvatarUpload";
import { SocialButtons } from "@/features/auth/components/SocialButtons";
import { PasswordStrengthMeter } from "@/features/auth/components/PasswordStrengthMeter";
import { UsernameAvailability } from "@/features/auth/components/UsernameAvailability";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { createClient } from "@/core/auth/supabase-client";

type Gender = "male" | "female";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold themed-text-2 mb-1.5 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all themed-text"
      style={{
        background: "var(--input-bg)",
        border: "1.5px solid var(--input-border)",
        color: "var(--input-text)",
      }}
      onFocus={e => { (e.target as HTMLInputElement).style.borderColor = "var(--input-border-focus)"; props.onFocus?.(e); }}
      onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "var(--input-border)"; props.onBlur?.(e); }}
    />
  );
}

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [enable2fa, setEnable2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleAvatarUpload = (result: { info?: unknown }) => {
    const info = result.info;
    if (info && typeof info === "object" && "secure_url" in info) {
      setAvatarUrl(info.secure_url as string);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!gender) { setError("Please select your gender."); return; }
    if (!termsAccepted) { setError("Please accept the Terms & Privacy Policy."); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`.trim(),
          username,
          gender,
          avatar_url: avatarUrl ?? undefined,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError) { setError(authError.message); setLoading(false); return; }

    // If 2FA enabled → QR setup, otherwise go straight to dashboard
    window.location.href = enable2fa ? "/setup-authenticator" : "/dashboard";
  };



  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "?";

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
            <h1 className="text-3xl font-black themed-text mb-1.5">Create account ✨</h1>
            <p className="themed-text-3 text-sm">
              Already have one?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--brand-text)" }}>
                Sign in
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
            <span className="text-xs themed-text-muted font-medium px-1">or fill in below</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
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
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--danger)" }}
              >
                <span className="mt-0.5 flex-shrink-0">⚠</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Avatar */}
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col items-center gap-2 py-1">
              <AvatarUpload avatarUrl={avatarUrl} initials={initials} onUpload={handleAvatarUpload} />
              {avatarUrl && (
                <button type="button" onClick={() => setAvatarUrl(null)} className="text-xs hover:underline" style={{ color: "var(--danger)" }}>
                  Remove photo
                </button>
              )}
            </motion.div>

            {/* Name */}
            <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <StyledInput required placeholder="Jane" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </Field>
              <Field label="Last name">
                <StyledInput required placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} />
              </Field>
            </motion.div>

            {/* Gender */}
            <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
              <label className="block text-xs font-semibold themed-text-2 mb-2 uppercase tracking-wide">Gender</label>
              <div className="grid grid-cols-2 gap-3">
                {(["male", "female"] as Gender[]).map((g) => {
                  const active = gender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all"
                      style={{
                        background: active ? "var(--grad-brand)" : "var(--surface)",
                        borderColor: active ? "transparent" : "var(--border)",
                        color: active ? "#fff" : "var(--text-secondary)",
                        boxShadow: active ? "var(--shadow-glow)" : "none",
                        transform: active ? "scale(1.02)" : "scale(1)",
                      }}
                    >
                      {g === "male" ? <Mars size={15} /> : <Venus size={15} />}
                      {g === "male" ? "Male" : "Female"}
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Username */}
            <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
              <Field label="Username">
                <StyledInput required placeholder="janedoe" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} />
              </Field>
              <UsernameAvailability username={username} />
            </motion.div>

            {/* Email */}
            <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
              <Field label="Email address">
                <StyledInput type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </Field>
            </motion.div>

            {/* Password */}
            <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
              <Field label="Password">
                <StyledInput type="password" required placeholder="Create a strong password" value={password} onChange={e => setPassword(e.target.value)} />
              </Field>
              <PasswordStrengthMeter password={password} />
            </motion.div>

            {/* Terms */}
            <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
              <button
                type="button"
                onClick={() => setTermsAccepted(v => !v)}
                className="w-full rounded-2xl border p-4 flex items-start gap-3 text-left transition-all focus:outline-none"
                style={{
                  background: termsAccepted ? "var(--grad-brand-soft)" : "var(--surface)",
                  borderColor: termsAccepted ? "var(--border-strong)" : "var(--border)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5 border transition-all"
                  style={{
                    background: termsAccepted ? "var(--grad-brand)" : "var(--surface)",
                    borderColor: termsAccepted ? "transparent" : "var(--border)",
                  }}
                >
                  {termsAccepted && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold themed-text mb-0.5">I agree to the Terms &amp; Privacy Policy</p>
                  <p className="text-xs themed-text-3 leading-relaxed">
                    Your data is encrypted and never shared with third parties.
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[10px] themed-text-muted">
                      <Shield size={9} className="text-success" /> Encrypted
                    </span>
                    <span className="flex items-center gap-1 text-[10px] themed-text-muted">
                      <Lock size={9} style={{ color: "var(--brand-text)" }} /> No spam
                    </span>
                  </div>
                </div>
              </button>
            </motion.div>

            {/* 2FA toggle */}
            <motion.div custom={11} variants={fadeUp} initial="hidden" animate="visible">
              <button
                type="button"
                onClick={() => setEnable2fa(v => !v)}
                className="w-full rounded-2xl border p-4 flex items-center gap-3 text-left transition-all focus:outline-none"
                style={{
                  background: enable2fa ? "linear-gradient(135deg,rgba(124,58,237,0.08),rgba(6,182,212,0.08))" : "var(--surface)",
                  borderColor: enable2fa ? "var(--brand-text)" : "var(--border)",
                  boxShadow: enable2fa ? "0 0 0 3px color-mix(in srgb, var(--brand-text) 15%, transparent)" : "none",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: enable2fa ? "var(--grad-brand)" : "var(--surface-elevated, var(--row-hover-bg))",
                    boxShadow: enable2fa ? "var(--shadow-glow)" : "none",
                  }}
                >
                  <ShieldCheck size={18} className={enable2fa ? "text-white" : ""} style={{ color: enable2fa ? "#fff" : "var(--text-muted)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold themed-text">Enable 2-Factor Authentication</p>
                  <p className="text-xs themed-text-3 mt-0.5">
                    {enable2fa ? "✓ QR code setup will open after registration" : "Scan a QR code with Google Authenticator after signup"}
                  </p>
                </div>
                {/* Toggle pill */}
                <div
                  className="relative w-11 h-6 rounded-full shrink-0 transition-colors"
                  style={{ background: enable2fa ? "var(--brand-text)" : "rgba(128,128,128,0.22)" }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all"
                    style={{ left: enable2fa ? "calc(100% - 20px)" : "4px" }}
                  />
                </div>
              </button>
            </motion.div>

            {/* Submit */}
            <motion.div custom={12} variants={fadeUp} initial="hidden" animate="visible">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.015 } : undefined}
                whileTap={!loading ? { scale: 0.98 } : undefined}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                style={{ background: "var(--grad-brand)", boxShadow: "var(--shadow-glow)" }}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : (
                  <>Create account <ArrowRight size={16} /></>
                )}
              </motion.button>
            </motion.div>

          </form>
        </div>
      </div>
    </div>
  );
}
