"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/shared/theme/ThemeProvider";

/**
 * compact=true  → single square icon button (for IconRail / tight spaces)
 * compact=false → sun/moon pill (for auth pages / wider areas)
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle, setTheme } = useTheme();
  const isDark = theme === "dark";

  if (compact) {
    return (
      <button
        onClick={toggle}
        title={isDark ? "Switch to light" : "Switch to dark"}
        className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200"
        style={{ color: "var(--rail-text)" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--row-hover-bg)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        {isDark ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme switcher"
      className="inline-flex items-center gap-1 rounded-full p-1"
      style={{ background: "var(--surface-2, var(--surface))", border: "1px solid var(--border)" }}
    >
      <ToggleBtn active={!isDark} onClick={() => setTheme("light")} label="Light" icon={<Sun size={14} />} />
      <ToggleBtn active={isDark}  onClick={() => setTheme("dark")}  label="Dark"  icon={<Moon size={14} />} />
    </div>
  );
}

function ToggleBtn({
  active, onClick, label, icon,
}: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={`Switch to ${label} theme`}
      aria-pressed={active}
      className="grid place-items-center w-7 h-7 rounded-full transition-all"
      style={{
        background: active ? "var(--grad-brand)" : "transparent",
        color: active ? "#fff" : "var(--text-muted)",
        boxShadow: active ? "var(--shadow-glow)" : "none",
      }}
    >
      {icon}
    </button>
  );
}
