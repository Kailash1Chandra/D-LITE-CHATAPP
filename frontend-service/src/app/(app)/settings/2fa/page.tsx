"use client";

import React, { useState } from "react";
import { SettingsHeader } from "@/features/settings/components/SettingsHeader";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";
import { ShieldCheck, Smartphone } from "lucide-react";

export default function TwoFactorAuthPage() {
  const [step, setStep] = useState<"intro" | "setup" | "success">("intro");
  const [code, setCode] = useState("");

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      <SettingsHeader title="Two-Factor Authentication" description="Add an extra layer of security to your account." />
      
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-sm text-center flex flex-col items-center">
        
        {step === "intro" && (
          <div className="max-w-sm animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[var(--row-hover-bg)] flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={32} className="text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Protect your account</h3>
            <p className="text-gray-500 mb-8 text-sm">
              Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to sign in.
            </p>
            <Button variant="primary" onClick={() => setStep("setup")} className="w-full">
              Enable 2FA
            </Button>
          </div>
        )}

        {step === "setup" && (
          <div className="max-w-sm w-full animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[var(--row-hover-bg)] flex items-center justify-center mx-auto mb-6">
              <Smartphone size={32} className="text-brand-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Enter Verification Code</h3>
            <p className="text-gray-500 mb-6 text-sm">
              We've sent a 6-digit code to your phone. Enter it below to verify.
            </p>
            <div className="mb-6">
              <Input 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                placeholder="000000" 
                className="text-center text-xl tracking-[0.5em] font-mono"
                maxLength={6}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("intro")} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={() => setStep("success")} className="flex-1" disabled={code.length !== 6}>Verify</Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="max-w-sm animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={32} className="text-success" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">2FA is Enabled</h3>
            <p className="text-gray-500 mb-8 text-sm">
              Your account is now protected with two-factor authentication. You will be asked for a code every time you sign in.
            </p>
            <Button variant="primary" onClick={() => setStep("intro")} className="w-full">
              Done
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
