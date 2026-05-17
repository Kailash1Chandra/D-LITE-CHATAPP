"use client";

import React from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { IconButton } from "@/shared/components/IconButton";
import { ShimmerText } from "./ShimmerText";

export function AIHeader() {
  return (
    <div className="h-[72px] shrink-0 border-b themed-border themed-surface/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 cursor-pointer">
        <div className="w-10 h-10 rounded-xl brand-grad flex items-center justify-center shadow-accent text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold themed-text flex items-center gap-2">
              <ShimmerText text="D-Lite AI" />
            </h3>
            <span className="bg-[var(--brand-100)] text-[var(--brand-700)] text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Beta</span>
          </div>
          <div className="text-xs themed-text-3 mt-0.5">Powered by GPT</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton size="md" variant="ghost" className="text-danger hover:bg-red-50" tooltip="Clear chat">
          <Trash2 size={18} />
        </IconButton>
      </div>
    </div>
  );
}
