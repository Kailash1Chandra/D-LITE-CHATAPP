"use client";

import React from "react";

export interface PillProps {
  children: React.ReactNode;
  variant?: "success" | "warn" | "danger" | "brand" | "neutral";
  dot?: boolean;
  className?: string;
}

export function Pill({ children, variant = "neutral", dot = false, className = "" }: PillProps) {
  const variantStyles = {
    success: "bg-[var(--success-bg)] text-[var(--success)]",
    warn: "bg-[rgba(245,158,11,0.12)] text-[var(--warn)]",
    danger: "bg-[rgba(239,68,68,0.1)] text-[var(--danger)]",
    brand: "bg-[var(--row-hover-bg)] text-[var(--brand-text)]",
    neutral: "bg-[var(--surface-2,var(--surface))] text-[var(--text-secondary)]",
  };

  const dotStyles = {
    success: "bg-[var(--success)]",
    warn: "bg-[var(--warn)]",
    danger: "bg-[var(--danger)]",
    brand: "bg-[var(--brand-500)]",
    neutral: "bg-[var(--text-muted)]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
}
