"use client";

import React from "react";
import { motion } from "framer-motion";

export interface SuggestionChipProps {
  emoji: string;
  label: string;
  onClick?: () => void;
}

export function SuggestionChip({ emoji, label, onClick }: SuggestionChipProps) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] shadow-sm px-3 py-2 rounded-full text-sm themed-text hover:border-[var(--border-strong)] hover:text-[var(--brand-text)] transition-colors"
    >
      <span>{emoji}</span>
      <span>{label}</span>
    </motion.button>
  );
}
