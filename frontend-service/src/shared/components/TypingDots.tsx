"use client";

import React from "react";

export function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full"
        style={{ animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "0s" }}
      />
      <div
        className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full"
        style={{ animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "0.2s" }}
      />
      <div
        className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full"
        style={{ animation: "typing-bounce 1.4s infinite ease-in-out both", animationDelay: "0.4s" }}
      />
    </div>
  );
}
