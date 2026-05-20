"use client";

import { motion } from "framer-motion";
import { Moon, Sun, Check } from "lucide-react";
import { useTheme } from "@/shared/theme/ThemeProvider";
import { ColorPicker, PALETTES, applyPalette } from "@/features/settings/components/ColorPicker";
import { useState, useEffect } from "react";

function ModeCard({
  mode, label, active, onClick,
}: {
  mode: "light" | "dark";
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const isDark = mode === "dark";
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative flex-1 rounded-2xl overflow-hidden cursor-pointer transition-all"
      style={{
        border: active ? "2px solid var(--brand-text)" : "2px solid var(--border)",
        boxShadow: active ? "0 0 0 4px color-mix(in srgb, var(--brand-text) 20%, transparent)" : "none",
      }}
    >
      {/* Mini UI preview */}
      <div
        className="p-3 pb-2"
        style={{ background: isDark ? "#0d0d0d" : "#f8f7f0" }}
      >
        {/* Fake top bar */}
        <div
          className="h-4 rounded-lg mb-2 px-2 flex items-center gap-1"
          style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
        >
          {[0,1,2].map(i => (
            <div key={i} className="w-1 h-1 rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }} />
          ))}
        </div>
        {/* Fake messages */}
        <div className="space-y-1.5">
          <div className="flex justify-start">
            <div className="h-5 w-28 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }} />
          </div>
          <div className="flex justify-end">
            <div className="h-5 w-20 rounded-lg" style={{ background: "var(--grad-brand)" }} />
          </div>
          <div className="flex justify-start">
            <div className="h-5 w-24 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }} />
          </div>
        </div>
      </div>

      {/* Label row */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ background: isDark ? "#111" : "#fff", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}
      >
        <div className="flex items-center gap-2">
          {isDark ? <Moon size={14} style={{ color: isDark ? "#a78bfa" : "#ea580c" }} /> : <Sun size={14} style={{ color: "#f97316" }} />}
          <span className="text-[13px] font-semibold" style={{ color: isDark ? "#f0f0ff" : "#1c1917" }}>
            {label}
          </span>
        </div>
        {active && (
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--brand-text)" }}>
            <Check size={11} className="text-white" strokeWidth={3} />
          </div>
        )}
      </div>
    </motion.button>
  );
}

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [palette, setPalette] = useState("aurora");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dlite-palette");
      if (saved) setPalette(saved);
    } catch {}
  }, []);

  function pickPalette(id: string) {
    setPalette(id);
    applyPalette(id);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-xl space-y-5"
    >
      <div>
        <h2 className="text-xl font-black mb-0.5" style={{ color: "var(--text-primary)" }}>Appearance</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Customize how D-LITE looks on your device.</p>
      </div>

      {/* ── Mode ── */}
      <section
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-muted)" }}>Mode</h3>
        </div>
        <div className="flex gap-3">
          <ModeCard mode="light" label="Light"  active={theme === "light"} onClick={() => setTheme("light")} />
          <ModeCard mode="dark"  label="Dark"   active={theme === "dark"}  onClick={() => setTheme("dark")}  />
        </div>
      </section>

      {/* ── Accent Color ── */}
      <section
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "var(--text-muted)" }}>Accent Color</h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Changes buttons, bubbles, highlights and glow.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {PALETTES.map(p => (
            <motion.button
              key={p.id}
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => pickPalette(p.id)}
              title={p.label}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-10 h-10 rounded-xl relative"
                style={{
                  background: p.gradient,
                  boxShadow: palette === p.id
                    ? `0 0 0 3px var(--surface), 0 0 0 5px ${p.vars["--brand-text"]}, 0 0 16px ${p.vars["--brand-text"]}80`
                    : "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                {palette === p.id && (
                  <Check size={16} className="absolute inset-0 m-auto text-white" strokeWidth={3} />
                )}
              </div>
              <span className="text-[11px] font-medium" style={{ color: palette === p.id ? "var(--brand-text)" : "var(--text-muted)" }}>
                {p.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Live preview */}
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: "var(--surface-2, var(--row-hover-bg))" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Preview</p>
          <div className="flex gap-2">
            <div className="h-8 px-4 rounded-xl flex items-center text-xs font-bold text-white" style={{ background: "var(--grad-brand)" }}>
              Button
            </div>
            <div className="h-8 px-4 rounded-xl border flex items-center text-xs font-semibold" style={{ borderColor: "var(--brand-text)", color: "var(--brand-text)" }}>
              Outline
            </div>
          </div>
          <div className="flex justify-end">
            <div className="px-3 py-1.5 rounded-xl text-xs text-white" style={{ background: "var(--msg-out-bg)", boxShadow: "var(--msg-out-shadow)" }}>
              Message sent ✓✓
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
