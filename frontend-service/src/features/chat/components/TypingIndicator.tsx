"use client";

import { TypingDots } from "@/shared/components/TypingDots";
import { Avatar } from "@/shared/components/Avatar";

export interface TypingIndicatorProps {
  name: string;
  initials: string;
}

export function TypingIndicator({ name, initials }: TypingIndicatorProps) {
  return (
    <div className="flex items-end gap-3 mb-4 max-w-[70%]">
      <Avatar initials={initials} size="sm" className="mb-1" />
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3"
        style={{ background: "var(--msg-in-bg)", border: "1px solid var(--msg-in-border)" }}
      >
        <TypingDots />
        <span className="text-xs mt-1 block" style={{ color: "var(--text-muted)" }}>
          {name} is typing…
        </span>
      </div>
    </div>
  );
}
