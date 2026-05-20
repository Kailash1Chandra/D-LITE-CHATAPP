"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

export const PALETTES = [
  {
    id: "aurora",
    label: "Aurora",
    gradient: "linear-gradient(135deg, #7c3aed, #06b6d4)",
    vars: {
      "--brand-text":        "#a78bfa",
      "--grad-brand":        "linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)",
      "--msg-out-bg":        "linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%)",
      "--msg-out-shadow":    "0 4px 24px rgba(124,58,237,0.5), 0 0 48px rgba(14,165,233,0.2)",
      "--row-active-border": "#7c3aed",
      "--input-border-focus":"#7c3aed",
      "--shadow-glow":       "0 0 24px rgba(124,58,237,0.6), 0 0 48px rgba(6,182,212,0.3)",
      "--accent-purple":     "#a78bfa",
      "--row-hover-bg":      "rgba(124,58,237,0.06)",
      "--row-active-bg":     "rgba(124,58,237,0.12)",
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    gradient: "linear-gradient(135deg, #facc15, #ea580c)",
    vars: {
      "--brand-text":        "#f97316",
      "--grad-brand":        "linear-gradient(135deg, #facc15 0%, #f97316 50%, #ea580c 100%)",
      "--msg-out-bg":        "linear-gradient(135deg, #f59e0b, #ea580c)",
      "--msg-out-shadow":    "0 4px 24px rgba(234,88,12,0.4)",
      "--row-active-border": "#ea580c",
      "--input-border-focus":"#ea580c",
      "--shadow-glow":       "0 0 24px rgba(249,115,22,0.6)",
      "--accent-purple":     "#fb923c",
      "--row-hover-bg":      "rgba(234,88,12,0.06)",
      "--row-active-bg":     "rgba(234,88,12,0.12)",
    },
  },
  {
    id: "rose",
    label: "Rose",
    gradient: "linear-gradient(135deg, #ec4899, #f43f5e)",
    vars: {
      "--brand-text":        "#f472b6",
      "--grad-brand":        "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
      "--msg-out-bg":        "linear-gradient(135deg, #ec4899, #f43f5e)",
      "--msg-out-shadow":    "0 4px 24px rgba(236,72,153,0.5)",
      "--row-active-border": "#ec4899",
      "--input-border-focus":"#ec4899",
      "--shadow-glow":       "0 0 24px rgba(236,72,153,0.6)",
      "--accent-purple":     "#f472b6",
      "--row-hover-bg":      "rgba(236,72,153,0.06)",
      "--row-active-bg":     "rgba(236,72,153,0.12)",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    vars: {
      "--brand-text":        "#38bdf8",
      "--grad-brand":        "linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)",
      "--msg-out-bg":        "linear-gradient(135deg, #0ea5e9, #06b6d4)",
      "--msg-out-shadow":    "0 4px 24px rgba(14,165,233,0.5)",
      "--row-active-border": "#0ea5e9",
      "--input-border-focus":"#0ea5e9",
      "--shadow-glow":       "0 0 24px rgba(14,165,233,0.6)",
      "--accent-purple":     "#38bdf8",
      "--row-hover-bg":      "rgba(14,165,233,0.06)",
      "--row-active-bg":     "rgba(14,165,233,0.12)",
    },
  },
  {
    id: "forest",
    label: "Forest",
    gradient: "linear-gradient(135deg, #10b981, #06b6d4)",
    vars: {
      "--brand-text":        "#34d399",
      "--grad-brand":        "linear-gradient(135deg, #10b981 0%, #06b6d4 100%)",
      "--msg-out-bg":        "linear-gradient(135deg, #10b981, #059669)",
      "--msg-out-shadow":    "0 4px 24px rgba(16,185,129,0.5)",
      "--row-active-border": "#10b981",
      "--input-border-focus":"#10b981",
      "--shadow-glow":       "0 0 24px rgba(16,185,129,0.6)",
      "--accent-purple":     "#34d399",
      "--row-hover-bg":      "rgba(16,185,129,0.06)",
      "--row-active-bg":     "rgba(16,185,129,0.12)",
    },
  },
];

export function applyPalette(id: string) {
  const palette = PALETTES.find(p => p.id === id);
  if (!palette) return;
  const root = document.documentElement;
  Object.entries(palette.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  try { localStorage.setItem("dlite-palette", id); } catch {}
}

export function ColorPicker() {
  const [selected, setSelected] = useState("aurora");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dlite-palette");
      if (saved && PALETTES.find(p => p.id === saved)) {
        setSelected(saved);
        applyPalette(saved);
      }
    } catch {}
  }, []);

  function pick(id: string) {
    setSelected(id);
    applyPalette(id);
  }

  return (
    <div className="flex items-center gap-2.5">
      {PALETTES.map(p => (
        <button
          key={p.id}
          onClick={() => pick(p.id)}
          title={p.label}
          className="relative w-9 h-9 rounded-full transition-transform hover:scale-110 active:scale-95"
          style={{
            background: p.gradient,
            boxShadow: selected === p.id
              ? `0 0 0 3px var(--surface), 0 0 0 5px ${p.vars["--brand-text"]}`
              : "none",
          }}
        >
          {selected === p.id && (
            <Check size={15} className="absolute inset-0 m-auto text-white" strokeWidth={3} />
          )}
        </button>
      ))}
    </div>
  );
}
