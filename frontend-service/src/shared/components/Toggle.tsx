"use client";

import { motion } from "framer-motion";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none transition-colors"
      style={{
        background: checked ? "var(--brand-text)" : "rgba(128,128,128,0.22)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: checked ? `0 0 10px color-mix(in srgb, var(--brand-text) 50%, transparent)` : "none",
        transition: "background 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      <motion.span
        layout
        className="inline-block h-4 w-4 rounded-full shadow-sm"
        style={{ background: "#ffffff" }}
        initial={false}
        animate={{ x: checked ? 24 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
