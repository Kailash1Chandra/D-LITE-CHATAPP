"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export interface ReactionPillProps {
  emoji: string;
  count: number;
  active?: boolean;
  onClick?: () => void;
}

export function ReactionPill({ emoji, count, active = false, onClick }: ReactionPillProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shadow-sm transition-colors"
      style={{
        background: active ? "var(--row-hover-bg)" : "var(--surface)",
        borderColor: active ? "var(--border-strong)" : "var(--border)",
        color: active ? "var(--brand-text)" : "var(--text-secondary)",
      }}
    >
      <span>{emoji}</span>
      <span style={{ color: active ? "var(--brand-text)" : "var(--text-muted)" }}>
        {count + (isHovered && !active ? 1 : 0)}
      </span>
    </motion.button>
  );
}
