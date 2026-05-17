"use client";

import { Sparkles, Trash2 } from "lucide-react";
import { IconButton } from "@/shared/components/IconButton";
import { ShimmerText } from "./ShimmerText";

export function AIHeader({ onClear }: { onClear?: () => void }) {
  return (
    <div className="h-[72px] shrink-0 border-b themed-border px-6 flex items-center justify-between sticky top-0 z-10"
      style={{ background: "var(--header-bg)", borderColor: "var(--header-border)" }}
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl brand-grad flex items-center justify-center shadow-accent text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold themed-text">
              <ShimmerText text="D-Lite AI" />
            </h3>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
              style={{ background: "var(--row-hover-bg)", color: "var(--brand-text)" }}>Beta</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton size="md" variant="ghost" tooltip="Clear chat" onClick={onClear}
          className="hover:bg-[var(--row-hover-bg)]" style={{ color: "var(--danger)" } as any}>
          <Trash2 size={18} />
        </IconButton>
      </div>
    </div>
  );
}
