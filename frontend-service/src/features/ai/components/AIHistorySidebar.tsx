"use client";

import { useState } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/shared/components/Button";

export function AIHistorySidebar({ onNew }: { onNew?: () => void }) {
  const [active, setActive] = useState(0);
  const history = [
    { title: "Refactor MessageBubble", date: "Today" },
    { title: "Summarize Q3 Planning", date: "Yesterday" },
    { title: "Write marketing copy", date: "Last Week" },
  ];

  return (
    <div className="w-[260px] h-full border-r themed-border themed-surface flex flex-col shrink-0">
      <div className="p-4 border-b themed-border">
        <h2 className="text-lg font-bold themed-text mb-4">AI Chats</h2>
        <Button variant="primary" className="w-full justify-start" iconLeft={<Plus size={16} />} onClick={onNew}>
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 mt-2 custom-scrollbar">
        {history.map((item, i) => (
          <div
            key={i}
            onClick={() => setActive(i)}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
              active === i ? "bg-[var(--row-active-bg)] font-medium" : "themed-text-2 hover:bg-[var(--row-hover-bg)] hover:themed-text"
            }`}
            style={{ color: active === i ? "var(--brand-text)" : undefined }}
          >
            <MessageSquare size={16} style={{ color: active === i ? "var(--brand-text)" : "var(--text-muted)" }} />
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{item.title}</div>
              {active === i && <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{item.date}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
