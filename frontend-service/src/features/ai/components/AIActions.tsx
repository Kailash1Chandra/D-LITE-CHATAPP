"use client";

import { Copy, RefreshCw, ThumbsUp } from "lucide-react";
import { IconButton } from "@/shared/components/IconButton";
import { useToast } from "@/shared/hooks/use-toast";

export function AIActions() {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText("Mock copied text");
    toast({ title: "Copied!", description: "Response copied to clipboard.", type: "success" });
  };

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border)]">
      <IconButton size="sm" variant="ghost" className="themed-text-muted hover:text-[var(--brand-text)] hover:bg-[var(--row-hover-bg)]" onClick={handleCopy} tooltip="Copy text">
        <Copy size={14} />
      </IconButton>
      <IconButton size="sm" variant="ghost" className="themed-text-muted hover:text-[var(--brand-text)] hover:bg-[var(--row-hover-bg)]" tooltip="Regenerate">
        <RefreshCw size={14} />
      </IconButton>
      <IconButton size="sm" variant="ghost" className="themed-text-muted hover:text-[var(--brand-text)] hover:bg-[var(--row-hover-bg)]" tooltip="Good response">
        <ThumbsUp size={14} />
      </IconButton>
      <div className="flex-1 text-right text-xs text-gray-400">
        Generated in 1.2s
      </div>
    </div>
  );
}
